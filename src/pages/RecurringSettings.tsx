import { useLiveQuery, eq } from "@tanstack/react-db";
import { useState } from "react";
import {
  transactionsCollection,
  categoriesCollection,
} from "../lib/collections";
import { TransactionForm } from "../components/TransactionForm";
import type { TransactionFormPayload } from "../components/TransactionForm";
import { supabase } from "../lib/supabase";

export default function RecurringSettings() {
  const { data: allTransactions = [] } = useLiveQuery(
    (q) =>
      q
        .from({ tx: transactionsCollection })
        .where(({ tx }) => eq(tx.recurrent, true)),
    [],
  );
  const { data: allTx = [] } = useLiveQuery(
    (q) => q.from({ tx: transactionsCollection }),
    [],
  );
  const childCountByPublicId = allTx.reduce<Record<string, number>>((acc, tx) => {
    if (tx.recurring_source_id) acc[tx.recurring_source_id] = (acc[tx.recurring_source_id] ?? 0) + 1;
    return acc;
  }, {});
  const { data: categories = [] } = useLiveQuery(
    (q) => q.from({ c: categoriesCollection }),
    [],
  );
  const categoriesById = Object.fromEntries(categories.map((c) => [c.id, c]));

  const [sortBy, setSortBy] = useState<"type" | "name" | "amount">("type");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">(
    "all",
  );

  const toggleSort = (field: "name" | "amount" | "type") => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir(field === "amount" ? "desc" : "asc");
    }
  };

  const seen = new Set<number>();
  const recurring = allTransactions
    .filter((tx): tx is typeof tx & { category_id: number } => {
      if (tx.category_id == null) return false;
      if (seen.has(tx.category_id)) return false;
      seen.add(tx.category_id);
      return true;
    })
    .filter((tx) => {
      if (filterType === "all") return true;
      return (categoriesById[tx.category_id]?.type ?? "expense") === filterType;
    })
    .sort((a, b) => {
      const catA = categoriesById[a.category_id];
      const catB = categoriesById[b.category_id];
      let cmp = 0;
      if (sortBy === "name")
        cmp = (catA?.name ?? "").localeCompare(catB?.name ?? "");
      else if (sortBy === "amount")
        cmp = Math.abs(a.amount) - Math.abs(b.amount);
      else if (sortBy === "type")
        cmp = (catA?.type ?? "").localeCompare(catB?.type ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });

  const handleSubmit = async (payload: TransactionFormPayload) => {
    const tx = allTx.find((t) => t.public_id === payload.public_id);
    if (!tx) return;
    if (tx.recurrent && !payload.recurrent) {
      await supabase
        .from("transactions")
        .update({ recurring_source_id: null })
        .eq("recurring_source_id", tx.public_id);
    }
    transactionsCollection.update(payload.public_id, (draft) => {
      draft.amount = payload.amount;
      draft.category_id = payload.category_id;
      draft.description = payload.description;
      draft.recurrent = payload.recurrent;
    });
  };

  const handleDelete = (publicId: string) => {
    transactionsCollection.delete(publicId);
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Recurring transactions</h1>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex self-start overflow-hidden rounded-lg border border-zinc-200 text-xs dark:border-zinc-700">
          {(["all", "expense", "income"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 transition-colors ${filterType === t ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
            >
              {t === "all" ? "All" : t === "expense" ? "Expenses" : "Income"}
            </button>
          ))}
        </div>
        <div className="flex self-start overflow-hidden rounded-lg border border-zinc-200 text-xs sm:ml-auto dark:border-zinc-700">
          {(["type", "name", "amount"] as const).map((field) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${sortBy === field ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
            >
              {field === "name"
                ? "Category"
                : field === "amount"
                  ? "Amount"
                  : "Type"}
              {sortBy === field && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {sortDir === "asc" ? (
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  ) : (
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  )}
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {recurring.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No recurring transactions.
        </p>
      ) : (
        <div className="flex flex-col">
          {recurring.map((tx, i) => (
            <TransactionForm
              key={tx.public_id}
              tx={tx}
              categories={categories}
              month={tx.date.slice(0, 7)}
              categoriesById={categoriesById}
              isFirst={i === 0}
              isLast={i === recurring.length - 1}
              confirmOnSave
              childCount={childCountByPublicId[tx.public_id] ?? 0}
              onSubmit={handleSubmit}
              onDelete={() => handleDelete(tx.public_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
