import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { EmailTransactionRow } from "../components/EmailTransactionRow";
import type { TransactionFormPayload } from "../components/TransactionForm";
import {
  categoriesCollection,
  emailTransactionsCollection,
  transactionsCollection,
} from "../lib/collections";
import { useHousehold } from "../lib/household";
import { supabase } from "../lib/supabase";

export default function Inbox() {
  const household = useHousehold();

  const { data: emailTxs = [] } = useLiveQuery(
    (q) => q.from({ e: emailTransactionsCollection }),
    [],
  );

  const { data: categories = [] } = useLiveQuery(
    (q) => q.from({ c: categoriesCollection }),
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

    transactionsCollection.insert({
      public_id: payload.public_id,
      date: payload.date,
      amount: payload.amount,
      category_id: categoryId,
      description: payload.description,
      household_id: household.id,
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
      {groupedByMonth.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">No pending transactions.</p>
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
