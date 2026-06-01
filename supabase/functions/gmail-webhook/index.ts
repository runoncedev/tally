import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { emailExtractors } from "./extractor.ts"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me"

// --- Gmail API ---

type GmailHeader = { name: string; value: string }
type GmailMessagePart = {
  mimeType?: string
  body?: { data?: string }
  parts?: GmailMessagePart[]
}
type GmailMessage = {
  id: string
  payload?: {
    headers?: GmailHeader[]
    body?: { data?: string }
    mimeType?: string
    parts?: GmailMessagePart[]
  }
}

async function gmailFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Gmail API ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

async function listHistoryMessageIds(startHistoryId: string, token: string): Promise<string[]> {
  const ids = new Set<string>()
  let pageToken: string | undefined
  let page = 0

  console.log("history.list startHistoryId:", startHistoryId)

  do {
    const params = new URLSearchParams({
      startHistoryId,
      labelId: "INBOX",
      historyTypes: "messageAdded",
    })
    if (pageToken) params.set("pageToken", pageToken)

    const data = await gmailFetch<{
      history?: { messagesAdded?: { message?: { id?: string } }[] }[]
      nextPageToken?: string
    }>(`/history?${params}`, token)

    for (const record of data.history ?? []) {
      for (const added of record.messagesAdded ?? []) {
        const id = added.message?.id
        if (id) ids.add(id)
      }
    }

    page++
    console.log(`history.list page ${page}: ${ids.size} ids so far, nextPageToken: ${data.nextPageToken ?? "none"}`)
    pageToken = data.nextPageToken
  } while (pageToken)

  console.log(`history.list total: ${ids.size} message ids found`)
  return [...ids]
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/")
  return new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)))
}

function getMessageText(payload: GmailMessagePart): string {
  if (payload.body?.data) return decodeBase64Url(payload.body.data)
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) return decodeBase64Url(part.body.data)
    }
    for (const part of payload.parts) {
      const nested = getMessageText(part)
      if (nested) return nested
    }
  }
  return ""
}

function getMessageFrom(message: GmailMessage): string {
  const headers = message.payload?.headers ?? []
  const raw = headers.find((h) => h.name.toLowerCase() === "from")?.value ?? ""
  const match = raw.match(/<([^>]+)>/)
  return (match ? match[1] : raw).trim().toLowerCase()
}

function getMessageBodyText(message: GmailMessage): string {
  return message.payload ? getMessageText(message.payload) : ""
}

// --- Parsers ---

function parseChileanAmount(amount: string): number {
  return parseFloat(amount.replace(/\./g, "").replace(",", "."))
}

function parseTransactedAt(datetime: string): string {
  const [datePart, timePart] = datetime.split(" ")
  const [dd, mm, yyyy] = datePart.split("/").map(Number)
  const [hours, minutes] = timePart.split(":").map(Number)
  return Temporal.ZonedDateTime.from({
    timeZone: "America/Santiago",
    year: yyyy, month: mm, day: dd,
    hour: hours, minute: minutes, second: 0,
  }).toInstant().toString()
}

// --- Handler ---

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

  // find household_id
  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single()

  if (!member) {
    console.log("no household found for", emailAddress)
    return new Response("ok", { status: 200 })
  }

  // read refresh token and last_history_id from DB
  const { data: tokenRow, error: tokenError } = await supabase
    .from("user_oauth_tokens")
    .select("refresh_token, last_history_id")
    .eq("user_id", user.id)
    .single()

  if (tokenError || !tokenRow) {
    console.log("no refresh token found for", emailAddress)
    return new Response("ok", { status: 200 })
  }

  // no baseline yet — store current historyId and wait for next notification
  if (!tokenRow.last_history_id) {
    await supabase
      .from("user_oauth_tokens")
      .update({ last_history_id: String(historyId) })
      .eq("user_id", user.id)
    console.log("no last_history_id, stored baseline:", historyId)
    return new Response("ok", { status: 200 })
  }

  // exchange refresh token for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokenRow.refresh_token,
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
    }),
  })

  const { access_token } = await tokenRes.json()
  if (!access_token) {
    console.error("failed to obtain access_token")
    return new Response("ok", { status: 200 })
  }

  // list new message ids from history
  let messageIds: string[]
  try {
    messageIds = await listHistoryMessageIds(tokenRow.last_history_id, access_token)
  } catch (err) {
    console.error("history.list failed:", err)
    return new Response("ok", { status: 200 })
  }

  // update last_history_id regardless of whether there were new messages
  await supabase
    .from("user_oauth_tokens")
    .update({ last_history_id: String(historyId) })
    .eq("user_id", user.id)

  if (messageIds.length === 0) return new Response("ok", { status: 200 })

  // check for already processed messages
  const { data: existing } = await supabase
    .from("email_transactions")
    .select("gmail_message_id")
    .in("gmail_message_id", messageIds)

  const existingIds = new Set(
    (existing ?? []).map((r) => r.gmail_message_id).filter(Boolean)
  )

  const inserts = []

  for (const messageId of messageIds) {
    if (existingIds.has(messageId)) continue

    const message = await gmailFetch<GmailMessage>(`/messages/${messageId}?format=full`, access_token)
    const from = getMessageFrom(message)
    const extractor = emailExtractors[from]
    if (!extractor) {
      console.log(`no extractor for message ${messageId}`)
      continue
    }

    const text = getMessageBodyText(message)
    const extracted = extractor(text)
    if (!extracted) {
      console.log(`extractor returned null for message ${messageId}`)
      continue
    }

    inserts.push({
      household_id: member.household_id,
      gmail_message_id: messageId,
      from,
      amount: parseChileanAmount(extracted.amount),
      merchant: extracted.merchant,
      transacted_at: parseTransactedAt(extracted.datetime),
    })
  }

  if (inserts.length > 0) {
    const { error } = await supabase
      .from("email_transactions")
      .upsert(inserts, { onConflict: "gmail_message_id", ignoreDuplicates: true })
    if (error) console.error("insert error:", error)
    else console.log("inserted", inserts.length, "email transactions")
  } else {
    console.log("no matching extractors for any message")
  }

  return new Response("ok", { status: 200 })
})
