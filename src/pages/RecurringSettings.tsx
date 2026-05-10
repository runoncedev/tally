import { useLiveQuery } from "@tanstack/react-db";
import { useState } from "react";
import { categoriesCollection } from "../lib/collections";

export default function RecurringSettings() {
  const { data: categories = [] } = useLiveQuery(
    (q) => q.from({ c: categoriesCollection }),
    [],
  );

  const [sortBy, setSortBy] = useState<"type" | "name" | "amount">("type");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");

  const toggleSort = (field: "name" | "amount" | "type") => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir(field === "amount" ? "desc" : "asc");
    }
  };

  const filtered = categories
    .filter((c) => filterType === "all" || c.type === filterType)
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "amount") cmp = (a.default_amount ?? 0) - (b.default_amount ?? 0);
      else if (sortBy === "type") cmp = a.type.localeCompare(b.type);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const handleToggleRecurring = (categoryId: number, value: boolean) => {
    categoriesCollection.update(categoryId, (draft) => {
      draft.recurring = value;
    });
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
              {field === "name" ? "Category" : field === "amount" ? "Amount" : "Type"}
              {sortBy === field && (
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {sortDir === "asc" ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
        {filtered.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium ${cat.type === "expense" ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" : "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"}`}>
                {cat.type}
              </span>
              <span className={`text-sm font-medium ${cat.recurring ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}`}>
                {cat.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {cat.recurring && cat.default_amount != null && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  ${cat.default_amount.toLocaleString("en-US")}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleToggleRecurring(cat.id, !cat.recurring)}
                className={`rounded-lg px-2 py-1 text-xs transition-colors ${cat.recurring ? "text-zinc-400 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800" : "text-zinc-400 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800"}`}
              >
                {cat.recurring ? "Remove" : "Add"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
