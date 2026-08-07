import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { registerGmailWatch } from "../_shared/gmail-watch.ts"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

Deno.serve(async (_req) => {
  const { data: tokens, error } = await supabase
    .from("user_oauth_tokens")
    .select("user_id, refresh_token")
    .eq("is_invalid", false)

  if (error) {
    console.error("gmail-watch-cron: failed to load tokens", error)
    return new Response("Failed to load tokens", { status: 500 })
  }

  console.log(`gmail-watch-cron: re-watching ${tokens.length} user(s)`)

  let succeeded = 0
  let failed = 0

  for (const { user_id, refresh_token } of tokens) {
    const result = await registerGmailWatch(refresh_token)
    if (!result.ok) {
      failed++
      console.error("gmail-watch-cron: watch failed", { user_id, status: result.status, error: result.error })
      if (result.invalidGrant) {
        await supabase.from("user_oauth_tokens").update({ is_invalid: true }).eq("user_id", user_id)
      }
      continue
    }

    succeeded++
    await supabase.from("user_oauth_tokens").update({ is_invalid: false }).eq("user_id", user_id)
    console.log("gmail-watch-cron: watch renewed", { user_id, expiration: result.expiration })
  }

  console.log(`gmail-watch-cron: done — ${succeeded} succeeded, ${failed} failed`)

  return new Response(JSON.stringify({ succeeded, failed }), {
    headers: { "Content-Type": "application/json" },
  })
})
