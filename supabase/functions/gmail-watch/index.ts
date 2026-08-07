import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { registerGmailWatch } from "../_shared/gmail-watch.ts"

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

  const result = await registerGmailWatch(refresh_token)
  if (!result.ok) {
    console.error("gmail-watch: watch registration failed", { user_id: user.id, status: result.status, error: result.error })
    return new Response("Gmail watch failed", { status: 502, headers: corsHeaders })
  }
  console.log("gmail-watch: watch registered", { historyId: result.historyId, expiration: result.expiration })

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
      ...(setHistoryId && { last_history_id: result.historyId }),
    },
    { onConflict: "user_id" }
  )
  console.log("gmail-watch: token upserted", { set_history_id: setHistoryId })

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
