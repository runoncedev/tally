export type WatchResult =
  | { ok: true; historyId: string; expiration: string }
  | { ok: false; status: number; error: string; invalidGrant: boolean }

export async function refreshAccessToken(refresh_token: string) {
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
  return { access_token: tokenData?.access_token as string | undefined, tokenData }
}

export async function registerGmailWatch(refresh_token: string): Promise<WatchResult> {
  const { access_token, tokenData } = await refreshAccessToken(refresh_token)
  if (!access_token) {
    return {
      ok: false,
      status: 502,
      error: tokenData?.error_description ?? tokenData?.error ?? "failed to obtain access_token",
      invalidGrant: tokenData?.error === "invalid_grant",
    }
  }

  const watchRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ topicName: "projects/tally-493920/topics/gmail", labelIds: ["INBOX"] }),
  })

  if (!watchRes.ok) {
    const body = await watchRes.text()
    return { ok: false, status: watchRes.status, error: body, invalidGrant: false }
  }

  const watchData = await watchRes.json()
  return { ok: true, historyId: String(watchData.historyId), expiration: watchData.expiration }
}
