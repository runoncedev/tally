import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

Deno.serve(async (req) => {
  const body = await req.json()

  const raw = body?.message?.data
  if (!raw) return new Response("ok", { status: 200 })

  const decoded = JSON.parse(atob(raw))
  const { emailAddress, historyId } = decoded
  console.log("gmail-webhook:", { emailAddress, historyId })

  if (!emailAddress || !historyId) return new Response("ok", { status: 200 })

  // find user_id by email
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const user = users.find((u) => u.email === emailAddress)
  if (!user) {
    console.log("no user found for", emailAddress)
    return new Response("ok", { status: 200 })
  }

  // find household_id by user_id
  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single()

  if (!member) {
    console.log("no household found for", emailAddress)
    return new Response("ok", { status: 200 })
  }

  const { error } = await supabase
    .from("gmail_history_queue")
    .insert({ household_id: member.household_id, history_id: String(historyId) })

  if (error) console.error("insert error:", error)
  else console.log("inserted history_id:", historyId)

  return new Response("ok", { status: 200 })
})
