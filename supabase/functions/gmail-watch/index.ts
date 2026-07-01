import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders })

  const { data: { user }, error: userError } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  )
  if (userError || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders })

  console.log("gmail-watch: invoked", { user_id: user.id, email: user.email })

  const { refresh_token } = await req.json()
  if (!refresh_token) return new Response("Missing refresh_token", { status: 400, headers: corsHeaders })

  // exchange refresh token for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
    }),
  })

  const tokenData = await tokenRes.json()
  const { access_token } = tokenData
  if (!access_token) {
    console.error("gmail-watch: failed to obtain access_token", { user_id: user.id, error: tokenData?.error, error_description: tokenData?.error_description })
    return new Response("Failed to obtain access token", { status: 502, headers: corsHeaders })
  }
  console.log("gmail-watch: access token obtained")

  // activate gmail watch
  const watchRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ topicName: "projects/tally-493920/topics/gmail", labelIds: ["INBOX"] }),
  })

  if (!watchRes.ok) {
    const body = await watchRes.text()
    console.error("gmail-watch: watch registration failed", { status: watchRes.status, body })
    return new Response("Gmail watch failed", { status: 502, headers: corsHeaders })
  }

  const watchData = await watchRes.json()
  console.log("gmail-watch: watch registered", { historyId: watchData.historyId, expiration: watchData.expiration })

  // upsert refresh token and clear is_invalid; set last_history_id only if not already set
  const { data: existing } = await supabase
    .from("user_oauth_tokens")
    .select("last_history_id")
    .eq("user_id", user.id)
    .single()

  const setHistoryId = existing?.last_history_id == null
  await supabase.from("user_oauth_tokens").upsert(
    {
      user_id: user.id,
      refresh_token,
      is_invalid: false,
      ...(setHistoryId && { last_history_id: String(watchData.historyId) }),
    },
    { onConflict: "user_id" }
  )
  console.log("gmail-watch: token upserted", { set_history_id: setHistoryId })

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
