const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

type GmailHeader = { name: string; value: string };

type GmailMessagePart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailMessagePart[];
};

export type GmailMessage = {
  id: string;
  payload?: {
    headers?: GmailHeader[];
    body?: { data?: string };
    mimeType?: string;
    parts?: GmailMessagePart[];
  };
};

type HistoryRecord = {
  messagesAdded?: { message?: { id?: string } }[];
};

type HistoryListResponse = {
  history?: HistoryRecord[];
  nextPageToken?: string;
};

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent ?? "";
}

function getMessageText(payload: GmailMessagePart): string {
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return stripHtml(decodeBase64Url(part.body.data));
      }
      const nested = getMessageText(part);
      if (nested) return nested;
    }
  }
  return "";
}

export function parseFromAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1] : from).trim().toLowerCase();
}

export function getMessageFrom(message: GmailMessage): string {
  const headers = message.payload?.headers ?? [];
  const raw = headers.find((h) => h.name.toLowerCase() === "from")?.value ?? "";
  return parseFromAddress(raw);
}

export function getMessageBodyText(message: GmailMessage): string {
  const payload = message.payload;
  if (!payload) return "";
  return getMessageText(payload);
}

async function gmailFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function listHistoryMessageIds(
  startHistoryId: string,
  token: string,
): Promise<string[]> {
  const ids = new Set<string>();
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      startHistoryId,
      labelId: "INBOX",
      historyTypes: "messageAdded",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const data = await gmailFetch<HistoryListResponse>(
      `/history?${params}`,
      token,
    );

    for (const record of data.history ?? []) {
      for (const added of record.messagesAdded ?? []) {
        const id = added.message?.id;
        if (id) ids.add(id);
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return [...ids];
}

export async function getGmailMessage(
  messageId: string,
  token: string,
): Promise<GmailMessage> {
  return gmailFetch<GmailMessage>(
    `/messages/${messageId}?format=full`,
    token,
  );
}
