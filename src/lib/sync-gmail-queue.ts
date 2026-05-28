import type { Database } from "../types/database.types";
import { emailExtractors } from "./email-extractor";
import { emailTransactionsCollection } from "./collections";
import {
  getGmailMessage,
  getMessageBodyText,
  getMessageFrom,
  listHistoryMessageIds,
} from "./gmail-api";
import { supabase } from "./supabase";

type EmailTransactionInsert =
  Database["public"]["Tables"]["email_transactions"]["Insert"];

type QueueRow = {
  id: string;
  history_id: string;
  received_at: string;
};

export function parseChileanAmount(amount: string): number {
  const cleaned = amount.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned);
}

export function parseTransactedAt(datetime: string): string {
  const [datePart, timePart] = datetime.split(" ");
  const [dd, mm, yyyy] = datePart.split("/").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  return new Date(yyyy, mm - 1, dd, hours, minutes).toISOString();
}

function pickOldestQueueRow(queue: QueueRow[]): QueueRow {
  return queue.reduce((oldest, row) =>
    row.received_at < oldest.received_at ? row : oldest,
  );
}

export async function syncGmailQueue(householdId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.provider_token;
  if (!token) {
    console.warn("syncGmailQueue: no provider_token (Google sign-in required)");
    return;
  }

  const { data: queue, error: queueError } = await supabase
    .from("gmail_history_queue")
    .select("id, history_id, received_at")
    .eq("household_id", householdId)
    .order("received_at", { ascending: true });

  if (queueError) throw queueError;
  if (!queue?.length) return;

  const queueIds = queue.map((r) => r.id);
  const startHistoryId = pickOldestQueueRow(queue).history_id;

  let messageIds: string[];
  try {
    messageIds = await listHistoryMessageIds(startHistoryId, token);
  } catch (err) {
    console.error("syncGmailQueue: history.list failed", err);
    throw err;
  }

  if (messageIds.length === 0) {
    const { error: deleteError } = await supabase
      .from("gmail_history_queue")
      .delete()
      .in("id", queueIds);
    if (deleteError) throw deleteError;
    return;
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("email_transactions")
    .select("gmail_message_id")
    .in("gmail_message_id", messageIds);

  if (existingError) throw existingError;

  const existingIds = new Set(
    (existingRows ?? [])
      .map((r) => r.gmail_message_id)
      .filter((id): id is string => id != null),
  );

  const inserts: EmailTransactionInsert[] = [];

  for (const messageId of messageIds) {
    if (existingIds.has(messageId)) continue;

    const message = await getGmailMessage(messageId, token);
    const from = getMessageFrom(message);
    const extractor = emailExtractors[from];
    if (!extractor) continue;

    const text = getMessageBodyText(message);
    const extracted = extractor(text);
    if (!extracted) continue;

    inserts.push({
      household_id: householdId,
      gmail_message_id: messageId,
      from,
      amount: parseChileanAmount(extracted.amount),
      merchant: extracted.merchant,
      transacted_at: parseTransactedAt(extracted.datetime),
    });
  }

  if (inserts.length > 0) {
    const { error: insertError } = await supabase
      .from("email_transactions")
      .upsert(inserts, {
        onConflict: "gmail_message_id",
        ignoreDuplicates: true,
      });
    if (insertError) throw insertError;
  }

  const { error: deleteError } = await supabase
    .from("gmail_history_queue")
    .delete()
    .in("id", queueIds);
  if (deleteError) throw deleteError;

  await emailTransactionsCollection.utils.refetch();
}
