import { useState } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import {
  categoriesCollection,
  transactionsCollection,
} from "../lib/collections";
import { supabase } from "../lib/supabase";
import { ExpandableRow } from "../components/ExpandableRow";

export default function CategoriesSettings() {
  const { data: categories = [] } = useLiveQuery(
    (q) => q.from({ c: categoriesCollection }),
    [],
  );
  const { data: allTx = [] } = useLiveQuery(
    (q) => q.from({ tx: transactionsCollection }),
    [],
  );
  const [sortBy, setSortBy] = useState<"type" | "tx" | "name">("type");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">(
    "all",
  );

  const txCountById = allTx.reduce<Record<number, number>>((acc, tx) => {
    if (tx.category_id != null)
      acc[tx.category_id] = (acc[tx.category_id] ?? 0) + 1;
    return acc;
  }, {});

  const toggleSort = (field: "tx" | "name" | "type") => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  };

  const sorted = [...categories]
    .filter((c) => filterType === "all" || c.type === filterType)
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "tx")
        cmp = (txCountById[a.id] ?? 0) - (txCountById[b.id] ?? 0);
      else if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "type") cmp = a.type.localeCompare(b.type);
      return sortDir === "asc" ? cmp : -cmp;
    });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Categories</h1>

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
          {(["type", "tx", "name"] as const).map((field) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${sortBy === field ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
            >
              {field === "type" ? "Type" : field === "tx" ? "# tx" : "Name"}
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

      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No categories.
        </p>
      ) : (
        <div className="flex flex-col">
          {sorted.map((cat, i) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              txCount={txCountById[cat.id] ?? 0}
              allTx={allTx}
              isFirst={i === 0}
              isLast={i === sorted.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryRow({
  cat,
  txCount,
  isFirst,
  isLast,
}: {
  cat: { id: number; name: string; type: string };
  txCount: number;
  allTx: { category_id: number | null }[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editName, setEditName] = useState(cat.name);
  const [editType, setEditType] = useState<"expense" | "income">(
    cat.type as "expense" | "income",
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const saveEdit = async (close: () => void) => {
    await supabase
      .from("categories")
      .update({ name: editName.trim(), type: editType })
      .eq("id", cat.id);
    await categoriesCollection.utils.refetch();
    close();
  };

  const handleDelete = async (close: () => void) => {
    if (txCount > 0) {
      setConfirmingDelete(true);
      return;
    }
    await supabase.from("categories").delete().eq("id", cat.id);
    await categoriesCollection.utils.refetch();
    close();
  };

  const confirmDelete = async (close: () => void) => {
    await supabase.from("categories").delete().eq("id", cat.id);
    await categoriesCollection.utils.refetch();
    close();
  };

  const summary = (
    <>
      <span
        className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${cat.type === "income" ? "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"}`}
      >
        {cat.type === "income" ? "Income" : "Expense"}
      </span>
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {cat.name}
      </span>
      {txCount > 0 && (
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {txCount} tx
        </span>
      )}
    </>
  );

  return (
    <ExpandableRow
      summary={summary}
      isFirst={isFirst}
      isLast={isLast}
      dimSummaryWhenOpen
    >
      {(close) => (
        <div className="flex flex-col gap-3 p-4">
          {confirmingDelete ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                <span className="font-medium">{cat.name}</span> has {txCount}{" "}
                transaction{txCount !== 1 ? "s" : ""}. Delete anyway?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => confirmDelete(close)}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-2">
                <select
                  value={editType}
                  onChange={(e) =>
                    setEditType(e.target.value as "expense" | "income")
                  }
                  className="shrink-0 rounded-md border border-zinc-200 bg-white px-1 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(close);
                    if (e.key === "Escape") close();
                  }}
                  className="flex-1 border-b border-zinc-300 bg-transparent py-0.5 text-sm text-zinc-800 outline-none dark:border-zinc-600 dark:text-zinc-200"
                />
              </div>
              <div className="flex h-8 items-center justify-between">
                <button
                  onClick={() => handleDelete(close)}
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => { close(); setEditName(cat.name); setEditType(cat.type as "expense" | "income"); }}
                    className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveEdit(close)}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white transition-opacity disabled:opacity-30 dark:bg-zinc-50 dark:text-zinc-900"
                  >
                    Save
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </ExpandableRow>
  );
}
