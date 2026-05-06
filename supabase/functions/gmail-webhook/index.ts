import "@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  const body = await req.json()
  console.log("gmail-webhook received:", JSON.stringify(body))

  // Pub/Sub sends messages base64-encoded in body.message.data
  const raw = body?.message?.data
  if (raw) {
    const decoded = atob(raw)
    console.log("decoded:", decoded)
  }

  return new Response("ok", { status: 200 })
})
