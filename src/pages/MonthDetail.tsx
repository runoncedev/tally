import { Select } from "@base-ui/react/select";
import { and, eq, gte, lt, useLiveQuery } from "@tanstack/react-db";
import { useNavigate, useParams } from "@tanstack/react-router";
import React, { useMemo, useRef, useState } from "react";
import { CurrencyFlow } from "../components/CurrencyFlow";
import { GroupRow } from "../components/GroupRow";
import type { TransactionFormPayload } from "../components/TransactionForm";
import { TransactionForm } from "../components/TransactionForm";
import type { Transaction } from "../lib/collections";
import {
  categoriesCollection,
  transactionsCollection,
} from "../lib/collections";
import { useHousehold } from "../lib/household";
import { supabase } from "../lib/supabase";

type GroupRowData = {
  kind: "group";
  categoryId: number | null;
  total: number;
  rows: Transaction[];
};
type Row = GroupRowData | (Transaction & { kind: "tx" });

function formatMonthLabel(month: string) {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon - 1).toLocaleString("default", {
    month: "short",
    year: "numeric",
  });
}

function adjacentMonth(month: string, delta: 1 | -1) {
  const [year, mon] = month.split("-").map(Number);
  const d = new Date(year, mon - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthDateRange(month: string) {
  const [year, mon] = month.split("-").map(Number);
  const start = `${year}-${String(mon).padStart(2, "0")}-01`;
  const end =
    mon === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(mon + 1).padStart(2, "0")}-01`;
  return { start, end };
}

function computeSummary(transactions: Transaction[]) {
  let income = 0,
    expenses = 0;
  for (const tx of transactions) {
    if (tx.amount >= 0) income += tx.amount;
    else expenses += Math.abs(tx.amount);
  }
  return { income, expenses, balance: income - expenses };
}

export default function MonthDetail() {
  const { month } = useParams({ from: "/month/$month" });
  const navigate = useNavigate();
  const household = useHousehold();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const now = new Date();
  const currentMonthLabel = `${now.getMonth() + 1}-${String(now.getFullYear()).slice(2)}`;

  const navigateMonth = (
    e: React.MouseEvent,
    m: string,
    direction: "forward" | "back",
  ) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (document.startViewTransition) {
      document.documentElement.dataset.navDirection = direction;
      document.startViewTransition(() =>
        navigate({ to: "/month/$month", params: { month: m } }),
      );
    } else {
      navigate({ to: "/month/$month", params: { month: m } });
    }
  };

  const monthPickerRef = useRef<HTMLInputElement>(null);
  const [newRows, setNewRows] = useState<
    {
      publicId: string;
      type: "income" | "expense";
      prefillCategoryId?: number;
      prefillDescription?: string;
      prefillAmount?: number;
    }[]
  >([]);
  const prevMonthRef = useRef(month);
  if (prevMonthRef.current !== month) {
    prevMonthRef.current = month;
    if (newRows.length > 0) setNewRows([]);
  }

  const { start, end } = useMemo(() => monthDateRange(month), [month]);

  const { data: monthTransactions = [], isLoading: txLoading } = useLiveQuery(
    (q) =>
      q
        .from({ tx: transactionsCollection })
        .where(({ tx }) => and(gte(tx.date, start), lt(tx.date, end)))
        .orderBy(({ tx }) => tx.created_at, "desc"),
    [start, end],
  );

  const { data: allRecurringCategories = [] } = useLiveQuery(
    (q) =>
      q
        .from({ c: categoriesCollection })
        .where(({ c }) => eq(c.recurring, true)),
    [],
  );

  const { data: categories = [], isLoading: categoriesLoading } = useLiveQuery(
    (q) => q.from({ c: categoriesCollection }),
    [],
  );

  const isLoading = txLoading || categoriesLoading;

  const transactions = monthTransactions;
  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  );
  const summary = useMemo(() => computeSummary(transactions), [transactions]);
  const recurringCategoryIds = useMemo(
    () => new Set(allRecurringCategories.map((c) => c.id)),
    [allRecurringCategories],
  );

  const rows = useMemo<Row[]>(() => {
    const groupMap = new Map<number | null, Transaction[]>();
    for (const tx of transactions) {
      const key = tx.category_id ?? null;
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(tx);
    }
    const result: Row[] = [];
    for (const [categoryId, txs] of groupMap.entries()) {
      if (txs.length === 1) {
        result.push({ kind: "tx" as const, ...txs[0] });
      } else {
        result.push({
          kind: "group" as const,
          categoryId,
          total: txs.reduce((sum, tx) => sum + tx.amount, 0),
          rows: txs,
        });
      }
    }
    return result;
  }, [transactions]);

  const recurringPrefills = useMemo(() => {
    const usedCategoryIds = new Set(transactions.map((tx) => tx.category_id).filter((id) => id != null));
    return allRecurringCategories.filter((c) => !usedCategoryIds.has(c.id));
  }, [transactions, allRecurringCategories]);

  const addRow = (type: "income" | "expense") =>
    setNewRows((prev) => [{ publicId: crypto.randomUUID(), type }, ...prev]);
  const removeRow = (publicId: string) =>
    setNewRows((prev) => prev.filter((r) => r.publicId !== publicId));

  const handleSubmit = async (payload: TransactionFormPayload) => {
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

    const tx = transactions.find((t) => t.public_id === payload.public_id);
    if (tx) {
      transactionsCollection.update(payload.public_id, (draft) => {
        draft.date = payload.date;
        draft.amount = payload.amount;
        draft.category_id = categoryId;
        draft.description = payload.description;
      });
    } else {
      transactionsCollection.insert({
        public_id: payload.public_id,
        date: payload.date,
        amount: payload.amount,
        category_id: categoryId,
        description: payload.description,
        household_id: household.id,
      });
    }
  };

  const handleDelete = (publicId: string) => {
    transactionsCollection.delete(publicId);
  };

  return (
    <div>
      <div className="sticky top-0 z-10 mb-6 flex flex-wrap items-center justify-between bg-white py-3 dark:bg-zinc-900">
        <div className="mr-2.5 flex items-center gap-2">
          <h1 className="text-xl font-semibold">{formatMonthLabel(month)}</h1>
          {month === currentMonth && (
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              current
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center">
          {month !== currentMonth && (
            <a
              href={`/month/${currentMonth}`}
              onClick={(e) =>
                navigateMonth(
                  e,
                  currentMonth,
                  month < currentMonth ? "forward" : "back",
                )
              }
              title="Go to current month"
              className="rounded-lg p-2.5 text-xs leading-none font-semibold text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              {currentMonthLabel}
            </a>
          )}
          <a
            href={`/month/${adjacentMonth(month, -1)}`}
            onClick={(e) => navigateMonth(e, adjacentMonth(month, -1), "back")}
            title={formatMonthLabel(adjacentMonth(month, -1))}
            className="rounded-lg p-2.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </a>
          <a
            href={`/month/${adjacentMonth(month, 1)}`}
            onClick={(e) =>
              navigateMonth(e, adjacentMonth(month, 1), "forward")
            }
            title={formatMonthLabel(adjacentMonth(month, 1))}
            className="rounded-lg p-2.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
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
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
          <div className="relative ml-1.5">
            <button
              onClick={() => monthPickerRef.current?.showPicker()}
              title="Pick a month"
              className="cursor-pointer rounded-lg p-2.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>
            <input
              ref={monthPickerRef}
              type="month"
              value={month}
              onChange={(e) => {
                const m = e.target.value;
                if (document.startViewTransition) {
                  document.documentElement.dataset.navDirection =
                    m >= month ? "forward" : "back";
                  document.startViewTransition(() =>
                    navigate({ to: "/month/$month", params: { month: m } }),
                  );
                } else {
                  navigate({ to: "/month/$month", params: { month: m } });
                }
              }}
              tabIndex={-1}
              className="pointer-events-none absolute inset-0 w-full opacity-0"
            />
          </div>
        </div>
      </div>

      <div
        style={{ viewTransitionName: "month-content" }}
        className="lg:grid lg:grid-cols-[300px_1fr] lg:items-start lg:gap-10"
      >
        {/* sidebar — sticky on desktop */}
        <div className="lg:sticky lg:top-20">
          <div key={month} className="mb-8">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Balance</p>
            <p
              className={`flex h-10 items-center text-3xl font-bold ${summary.balance > 0 ? "text-green-600 dark:text-green-400" : summary.balance < 0 ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}
            >
              <CurrencyFlow
                value={summary.balance}
                className={isLoading ? "animate-pulse" : ""}
              />
            </p>
            {/* mobile: stacked */}
            <div className="mt-1 flex gap-4 text-sm text-zinc-500 sm:hidden dark:text-zinc-400">
              <span className="flex flex-col">
                <span>Income</span>
                <CurrencyFlow
                  value={summary.income}
                  className={`font-medium ${isLoading ? "animate-pulse" : summary.income > 0 ? "text-green-600 dark:text-green-400" : "text-zinc-400 dark:text-zinc-500"}`}
                />
              </span>
              <span className="flex flex-col">
                <span>Expenses</span>
                <CurrencyFlow
                  value={summary.expenses}
                  className={`font-medium ${isLoading ? "animate-pulse" : summary.expenses > 0 ? "text-red-600 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500"}`}
                />
              </span>
            </div>
            {/* sm+: inline with dot */}
            <div className="mt-1 hidden gap-3 text-sm text-zinc-500 sm:flex dark:text-zinc-400">
              <span>
                Income{" "}
                <CurrencyFlow
                  value={summary.income}
                  className={`font-medium ${isLoading ? "animate-pulse" : summary.income > 0 ? "text-green-600 dark:text-green-400" : "text-zinc-400 dark:text-zinc-500"}`}
                />
              </span>
              <span>·</span>
              <span>
                Expenses{" "}
                <CurrencyFlow
                  value={summary.expenses}
                  className={`font-medium ${isLoading ? "animate-pulse" : summary.expenses > 0 ? "text-red-600 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500"}`}
                />
              </span>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
            {/* left group: Add income + Add expense */}
            <div className="flex gap-2 lg:w-full">
              <button
                onClick={() => addRow("income")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-300 py-2 text-sm text-zinc-600 transition-colors hover:border-zinc-400 sm:flex-none sm:px-4 lg:flex-1 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-500 dark:text-green-400"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 19 19 12" />
                </svg>
                Add income
              </button>
              <button
                onClick={() => addRow("expense")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-300 py-2 text-sm text-zinc-600 transition-colors hover:border-zinc-400 sm:flex-none sm:px-4 lg:flex-1 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-500 dark:text-red-400"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 5 5 12" />
                </svg>
                Add expense
              </button>
            </div>

            {/* right group: Add recurring + Clear month (ml-auto pushes to right on sm+) */}
            {(recurringPrefills.length > 0 || (import.meta.env.DEV && transactions.length > 0)) && (
              <div className="flex flex-col gap-2 sm:flex-1 sm:flex-row lg:flex-col">
                {recurringPrefills.length > 0 && (
                  <Select.Root
                    value=""
                    onValueChange={(categoryIdStr: string | null) => {
                      if (!categoryIdStr) return;
                      if (categoryIdStr === "__add_all__") {
                        const now = Date.now();
                        recurringPrefills.forEach((cat, i) => {
                          transactionsCollection.insert({
                            public_id: crypto.randomUUID(),
                            date: `${month}-01`,
                            amount: cat.type === "expense" ? -(cat.default_amount ?? 0) : (cat.default_amount ?? 0),
                            category_id: cat.id,
                            description: null,
                            created_at: new Date(now + i).toISOString(),
                            household_id: household.id,
                          });
                        });
                        return;
                      }
                      const cat = recurringPrefills.find((c) => String(c.id) === categoryIdStr);
                      if (!cat) return;
                      setNewRows((prev) => [
                        {
                          publicId: crypto.randomUUID(),
                          type: cat.type as "income" | "expense",
                          prefillCategoryId: cat.id,
                          prefillAmount: cat.default_amount ?? undefined,
                        },
                        ...prev,
                      ]);
                    }}
                  >
                    <Select.Trigger className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 py-2 text-sm text-zinc-600 transition-colors hover:border-zinc-400 sm:w-auto sm:px-4 lg:w-full dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="17 1 21 5 17 9" />
                        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                        <polyline points="7 23 3 19 7 15" />
                        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                      </svg>
                      Add recurring
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Positioner sideOffset={6} side="bottom" align="center" alignItemWithTrigger={false} collisionPadding={{ top: 56, bottom: 8, left: 8, right: 8 }}>
                        <Select.Popup className="z-50 w-[calc(var(--anchor-width)+1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-none rounded-xl bg-white p-1.5 shadow-md ring-1 ring-zinc-200 [max-height:min(var(--available-height),12rem)] dark:bg-zinc-900 dark:ring-zinc-700">
                          <Select.List className="w-full">
                            {recurringPrefills.map((cat) => (
                              <Select.Item
                                key={cat.id}
                                value={String(cat.id)}
                                className="flex w-full cursor-default items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm outline-none select-none data-highlighted:bg-zinc-100 dark:data-highlighted:bg-zinc-800"
                              >
                                <Select.ItemText className="text-zinc-900 dark:text-zinc-100">{cat.name}</Select.ItemText>
                                <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium ${cat.type === "expense" ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" : "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"}`}>
                                  {cat.type}
                                </span>
                              </Select.Item>
                            ))}
                            <Select.Item
                              value="__add_all__"
                              className="flex w-full cursor-default items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none select-none data-highlighted:bg-zinc-100 dark:data-highlighted:bg-zinc-800"
                            >
                              <Select.ItemText className="text-zinc-400 dark:text-zinc-500">Add all</Select.ItemText>
                            </Select.Item>
                          </Select.List>
                        </Select.Popup>
                      </Select.Positioner>
                    </Select.Portal>
                  </Select.Root>
                )}
                {import.meta.env.DEV && transactions.length > 0 && (
                  <button
                    onClick={() => {
                      if (
                        !confirm(
                          `Delete all ${transactions.length} transactions in ${formatMonthLabel(month)}?`,
                        )
                      )
                        return;
                      transactions.forEach((tx) =>
                        transactionsCollection.delete(tx.public_id),
                      );
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 px-4 py-2 text-sm text-red-500 transition-colors hover:border-red-400 sm:ml-auto sm:w-auto lg:ml-0 lg:w-full dark:border-red-800 dark:text-red-400 dark:hover:border-red-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                    Clear month
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* transactions list */}
        <div className="flex flex-col">
          {newRows.map((row) => (
            <div key={row.publicId} className="mb-4">
              <TransactionForm
                categories={categories}
                month={month}
                categoriesById={categoriesById}
                initialType={row.type}
                publicId={row.publicId}
                prefillCategoryId={row.prefillCategoryId}
                prefillDescription={row.prefillDescription}
                prefillAmount={row.prefillAmount}
                prefillCategoryType={row.type}
                isRecurringPrefill={false}
                initiallyDirty={!!row.prefillCategoryId}
                focusOnMount
                isFirst
                isLast
                onSaved={() => removeRow(row.publicId)}
                onDelete={() => removeRow(row.publicId)}
                onSubmit={handleSubmit}
              />
            </div>
          ))}

          {!isLoading &&
            newRows.length === 0 &&
            transactions.length === 0 && (
              <div
                className="hidden flex-col items-center justify-center gap-6 py-16 text-zinc-400 lg:flex dark:text-zinc-500"
                style={{ viewTransitionName: "empty-state" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="96"
                  height="96"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ overflow: "visible" }}
                >
                  <g style={{ animation: "float 4s ease-in-out infinite" }}>
                    <circle cx="7.5" cy="16.5" r="5.5" />
                    <path d="M7.001 15.085A1.5 1.5 0 0 1 9 16.5" />
                  </g>
                  <g
                    style={{
                      animation: "float-slow 5s ease-in-out infinite 1s",
                    }}
                  >
                    <circle cx="18.5" cy="8.5" r="3.5" />
                  </g>
                  <g
                    style={{
                      animation: "float-small 3.5s ease-in-out infinite 0.5s",
                    }}
                  >
                    <circle cx="7.5" cy="4.5" r="2.5" />
                  </g>
                </svg>
                <p
                  className="text-lg font-semibold tracking-widest select-none"
                  aria-label="Nothing to show yet"
                >
                  {"Nothing to show yet".split("").map((char, i) => (
                    <span
                      key={i}
                      style={{
                        display: "inline-block",
                        animation: `wave-letter 4s ease-in-out infinite`,
                        animationDelay: `${i % 2 === 0 ? 0 : 2}s`,
                      }}
                    >
                      {char === " " ? " " : char}
                    </span>
                  ))}
                </p>
              </div>
            )}
          {rows.map((row, i) =>
            row.kind === "tx" ? (
              <TransactionForm
                key={row.public_id}
                tx={row}
                categories={categories}
                month={month}
                categoriesById={categoriesById}
                isRecurringCategory={
                  row.category_id != null &&
                  recurringCategoryIds.has(row.category_id)
                }
                isFirst={i === 0}
                isLast={i === rows.length - 1}
                onSubmit={handleSubmit}
                onDelete={() => handleDelete(row.public_id)}
                hideMonthInDeleteDialog
              />
            ) : (
              <GroupRow
                key={row.categoryId ?? "uncategorized"}
                categoryId={row.categoryId}
                total={row.total}
                rows={row.rows}
                categories={categories}
                categoriesById={categoriesById}
                month={month}
                activeRecurringIds={recurringCategoryIds}
                isFirst={i === 0}
                isLast={i === rows.length - 1}
                onSubmit={handleSubmit}
                onDelete={handleDelete}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
