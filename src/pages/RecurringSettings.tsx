import { useLiveQuery } from "@tanstack/react-db";
import { useState } from "react";
import { categoriesCollection } from "../lib/collections";
import { ExpandableRow } from "../components/ExpandableRow";
import { useAmountInput } from "../hooks/useAmountInput";

function CategoryForm({
  categoryId,
  initialType,
  initialName,
  initialRecurring,
  initialAmount,
  onClose,
}: {
  categoryId: number;
  initialType: "income" | "expense";
  initialName: string;
  initialRecurring: boolean;
  initialAmount: number | null;
  onClose: () => void;
}) {
  const [type, setType] = useState(initialType);
  const [name, setName] = useState(initialName);
  const [recurring, setRecurring] = useState(initialRecurring);
  const [amountRaw, setAmountRaw] = useState(
    initialAmount != null ? String(initialAmount) : "",
  );
  const amount = useAmountInput(amountRaw, setAmountRaw);

  const handleSave = () => {
    categoriesCollection.update(categoryId, (draft) => {
      draft.type = type;
      draft.name = name.trim() || initialName;
      draft.recurring = recurring;
      draft.default_amount = amountRaw !== "" ? Number(amountRaw) : null;
    });
    onClose();
  };

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setType((t) => (t === "income" ? "expense" : "income"))}
          className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-medium transition-opacity hover:opacity-75 ${type === "income" ? "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"}`}
        >
          {type === "income" ? "Income" : "Expense"}
        </button>
        <div className="flex flex-1 items-baseline gap-1 rounded-lg bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
          <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">$</span>
          <input
            ref={amount.ref}
            type="text"
            inputMode="numeric"
            value={amount.displayValue}
            placeholder="0"
            onKeyDown={amount.onKeyDown}
            onChange={amount.onChange}
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name"
        className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-lg text-zinc-800 outline-none placeholder:text-zinc-400 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setRecurring((r) => !r)}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${recurring ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" : "text-zinc-400 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800"}`}
        >
          {recurring ? "Recurring on" : "Recurring off"}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecurringSettings() {
  const { data: categories = [] } = useLiveQuery(
    (q) => q.from({ c: categoriesCollection }),
    [],
  );

  const [sortBy, setSortBy] = useState<"type" | "name" | "amount">("type");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"all" | "expense" | "income" | "recurring">("all");

  const toggleSort = (field: "name" | "amount" | "type") => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir(field === "amount" ? "desc" : "asc");
    }
  };

  const filtered = categories
    .filter((c) => {
      if (filterType === "recurring") return c.recurring;
      return filterType === "all" || c.type === filterType;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "amount") cmp = (a.default_amount ?? 0) - (b.default_amount ?? 0);
      else if (sortBy === "type") cmp = a.type.localeCompare(b.type);
      return sortDir === "asc" ? cmp : -cmp;
    });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Categories</h1>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex self-start overflow-hidden rounded-lg border border-zinc-200 text-xs dark:border-zinc-700">
          {(["all", "expense", "income", "recurring"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 transition-colors ${filterType === t ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
            >
              {t === "all" ? "All" : t === "expense" ? "Expenses" : t === "income" ? "Income" : "Recurring"}
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

      <div className="flex flex-col">
        {filtered.map((cat, i) => (
          <ExpandableRow
            key={cat.id}
            isFirst={i === 0}
            isLast={i === filtered.length - 1}
            dimSummaryWhenOpen
            summary={
              <>
                <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium ${cat.type === "expense" ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" : "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"}`}>
                  {cat.type}
                </span>
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  {cat.name}
                </span>
                <div className="ml-auto flex items-center gap-3">
                  {cat.recurring && cat.default_amount != null && (
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      ${cat.default_amount.toLocaleString("en-US")}
                    </span>
                  )}
                </div>
              </>
            }
          >
            {(close) => (
              <CategoryForm
                categoryId={cat.id}
                initialType={cat.type as "income" | "expense"}
                initialName={cat.name}
                initialRecurring={cat.recurring}
                initialAmount={cat.default_amount ?? null}
                onClose={close}
              />
            )}
          </ExpandableRow>
        ))}
      </div>
    </div>
  );
}
