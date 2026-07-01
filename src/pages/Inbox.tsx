import { useLiveQuery } from "@tanstack/react-db";
import { useMemo } from "react";
import { EmailTransactionRow } from "../components/EmailTransactionRow";
import type { TransactionFormPayload } from "../components/TransactionForm";
import { EmptyState } from "../components/EmptyState";
import {
    categoriesCollection,
    emailTransactionsCollection,
    merchantMappingsCollection,
    oauthTokensCollection,
    transactionsCollection,
} from "../lib/collections";
import { useHousehold } from "../lib/household";
import { supabase } from "../lib/supabase";

export default function Inbox() {
  const household = useHousehold();
  const { data: oauthTokens = [] } = useLiveQuery(
    (q) => q.from({ t: oauthTokensCollection }),
    [],
  );
  const gmailInvalid = oauthTokens[0]?.is_invalid ?? false;

  const { data: emailTxs = [] } = useLiveQuery(
    (q) => q.from({ e: emailTransactionsCollection }).orderBy(({ e }) => e.transacted_at, "desc"),
    [],
  );

  const { data: categories = [] } = useLiveQuery(
    (q) => q.from({ c: categoriesCollection }),
    [],
  );

  const { data: merchantMappings = [] } = useLiveQuery(
    (q) => q.from({ m: merchantMappingsCollection }),
    [],
  );

  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  );

  const groupedByMonth = useMemo(() => {
    const map = new Map<string, typeof emailTxs>();
    for (const tx of emailTxs) {
      const month = tx.transacted_at ? tx.transacted_at.slice(0, 7) : "unknown";
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(tx);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [emailTxs]);

  const merchantToCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of merchantMappings) {
      if (!m.merchant) continue;
      map[m.merchant.toLowerCase()] = m.category_id;
    }
    return map;
  }, [merchantMappings]);

  function formatMonthLabel(month: string) {
    if (month === "unknown") return "Unknown";
    const [year, mon] = month.split("-").map(Number);
    return new Date(year, mon - 1).toLocaleString("default", { month: "long", year: "numeric" });
  }

  const handleSave = async (emailTxId: string, payload: TransactionFormPayload) => {
    let categoryId = payload.category_id;
    if (categoryId === -1 && payload.categoryName) {
      const { data, error } = await supabase
        .from("categories")
        .insert({ name: payload.categoryName, type: payload.amount >= 0 ? "income" : "expense", household_id: household.id })
        .select("id")
        .single();
      if (error) throw error;
      categoryId = data.id;
      await categoriesCollection.utils.refetch();
    }

    // Persist merchant -> category mapping if we have a merchant and resolved category
    const emailTx = emailTxs.find((e) => e.id === emailTxId);
    const merchantName = emailTx?.merchant ?? null;
    if (merchantName && categoryId != null) {
      const merchantTrim = merchantName.trim();
      const { data: existing } = await supabase
        .from('merchant_category_mappings')
        .select('id')
        .eq('household_id', household.id)
        .ilike('merchant', merchantTrim)
        .maybeSingle();
      if (existing) {
        await supabase.from('merchant_category_mappings').update({ category_id: categoryId }).eq('id', existing.id);
      } else {
        await supabase.from('merchant_category_mappings').insert({ merchant: merchantTrim, category_id: categoryId, household_id: household.id });
      }
      await merchantMappingsCollection.utils.refetch();
    }

    transactionsCollection.insert({
      public_id: payload.public_id,
      date: payload.date,
      amount: payload.amount,
      category_id: categoryId,
      description: payload.description,
      household_id: household.id,
      via: emailTx?.from ?? null,
    });

    emailTransactionsCollection.update(emailTxId, (draft) => {
      draft.deleted_at = new Date().toISOString();
    });
  };

  const handleDiscard = (emailTxId: string) => {
    emailTransactionsCollection.update(emailTxId, (draft) => {
      draft.deleted_at = new Date().toISOString();
    });
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Inbox</h1>
      {gmailInvalid && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-900 dark:bg-red-950/40">
          <span className="text-red-700 dark:text-red-400">Gmail connection expired. Sign in again to keep syncing.</span>
          <button
            onClick={() => supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: window.location.origin,
                scopes: "https://www.googleapis.com/auth/gmail.readonly",
                queryParams: { access_type: "offline", prompt: "consent" },
              },
            })}
            className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            Reconnect
          </button>
        </div>
      )}
      {groupedByMonth.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-8">
          {groupedByMonth.map(([month, txs]) => (
            <div key={month}>
              <h2 className="mb-3 text-sm font-medium text-zinc-400 dark:text-zinc-500">
                {formatMonthLabel(month)}
              </h2>
              <div className="flex flex-col">
                {txs.map((emailTx, i) => (
                  <EmailTransactionRow
                    key={emailTx.id}
                    emailTx={emailTx}
                    categories={categories}
                    categoriesById={categoriesById}
                    prefillCategoryId={merchantToCategory[emailTx.merchant?.toLowerCase() ?? '']}
                    isFirst={i === 0}
                    isLast={i === txs.length - 1}
                    onSave={(payload) => handleSave(emailTx.id, payload)}
                    onDiscard={() => handleDiscard(emailTx.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
