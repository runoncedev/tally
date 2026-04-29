import { useRef, useState } from "react";
import type { Category, Transaction } from "../lib/collections";
import {
  transactionsCollection,
  categoriesCollection,
} from "../lib/collections";
import { supabase } from "../lib/supabase";
import { useHousehold } from "../lib/household";
import { Autocomplete } from "@base-ui/react/autocomplete";
import { ExpandableRow } from "./ExpandableRow";

type TransactionFormProps = {
  tx?: Transaction;
  categories: Category[];
  month: string;
  categoriesById: Record<number, Category>;
  prefillCategoryId?: number;
  prefillCategoryType?: "income" | "expense";
  prefillAmount?: number;
  prefillDescription?: string;
  initialType?: "income" | "expense";
  publicId?: string;
  focusOnMount?: boolean;
  isRecurringPrefill?: boolean;
  isRecurringCategory?: boolean;
  recurringSourceId?: string;
  isFirst?: boolean;
  isLast?: boolean;
  nested?: boolean;
  onSaved?: () => void;
  onDelete?: () => void;
};

type FormState = {
  date: string;
  amount: string;
  category_id: number | null;
  type: "income" | "expense";
  description: string;
  recurrent: boolean;
};

function txToForm(tx: Transaction): FormState {
  return {
    date: tx.date.slice(0, 10),
    amount: String(Math.abs(tx.amount)),
    category_id: tx.category_id,
    type: tx.amount >= 0 ? "income" : "expense",
    description: tx.description ?? "",
    recurrent: tx.recurrent,
  };
}

function emptyForm(
  month: string,
  prefillCategoryId?: number,
  prefillCategoryType?: "income" | "expense",
  prefillAmount?: number,
  prefillDescription?: string,
): FormState {
  return {
    date: `${month}-01`,
    amount: prefillAmount != null ? String(prefillAmount) : "",
    category_id: prefillCategoryId ?? null,
    type: prefillCategoryType ?? "expense",
    description: prefillDescription ?? "",
    recurrent: false,
  };
}

export function TransactionForm({
  tx,
  categories,
  month,
  categoriesById,
  prefillCategoryId,
  prefillCategoryType,
  prefillAmount,
  prefillDescription,
  initialType,
  publicId,
  focusOnMount = false,
  isRecurringPrefill = false,
  isRecurringCategory = false,
  recurringSourceId,
  isFirst = false,
  isLast = false,
  nested = false,
  onSaved,
  onDelete,
}: TransactionFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    tx
      ? txToForm(tx)
      : emptyForm(
          month,
          prefillCategoryId,
          prefillCategoryType ?? initialType,
          prefillAmount,
          prefillDescription,
        ),
  );
  const [isDirty, setIsDirty] = useState(false);
  const household = useHousehold();
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const patch = (p: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...p }));
    setIsDirty(true);
  };

  const [categoryInputValue, setCategoryInputValue] = useState(() => {
    if (form.category_id === null) return "";
    return categories.find((c) => c.id === form.category_id)?.name ?? "";
  });

  const type = form.type;
  const filteredCategories = categories.filter((c) => c.type === type);
  const canSave = (isDirty || isRecurringPrefill) && form.amount !== "";

  const handleSave = async () => {
    if (!canSave) return;
    const rawAmount = parseInt(form.amount, 10);
    if (isNaN(rawAmount)) return;
    const amount = form.type === "expense" ? -rawAmount : rawAmount;

    let categoryId = form.category_id;
    if (categoryId === -1) {
      const { data, error } = await supabase
        .from("categories")
        .insert({ name: categoryInputValue.trim(), type: form.type, household_id: household.id })
        .select("id")
        .single();
      if (error) throw error;
      categoryId = data.id;
      await categoriesCollection.utils.refetch();
    }

    const payload = {
      date: form.date,
      amount,
      category_id: categoryId,
      description: form.description || null,
      recurrent: form.recurrent,
    };

    if (tx) {
      if (tx.recurrent && !payload.recurrent) {
        await supabase
          .from("transactions")
          .update({ recurring_source_id: null })
          .eq("recurring_source_id", tx.public_id);
      }
      transactionsCollection.update(tx.public_id, (draft) => {
        draft.date = payload.date;
        draft.amount = payload.amount;
        draft.category_id = payload.category_id;
        draft.description = payload.description;
        draft.recurrent = payload.recurrent;
      });
      setIsDirty(false);
    } else {
      transactionsCollection.insert({
        ...payload,
        public_id: publicId ?? crypto.randomUUID(),
        recurring_source_id: recurringSourceId ?? null,
        household_id: household.id,
      });
      onSaved?.();
    }
  };

  const handleCancel = () => {
    if (!tx) {
      onDelete?.();
    } else {
      const restored = txToForm(tx);
      setForm(restored);
      setCategoryInputValue(
        tx.category_id
          ? (categories.find((c) => c.id === tx.category_id)?.name ?? "")
          : "",
      );
      setIsDirty(false);
    }
  };

  const handleDelete = () => {
    if (!tx) return;
    confirmDialogRef.current?.showModal();
  };

  const handleConfirmDelete = () => {
    confirmDialogRef.current?.close();
    if (!tx) return;
    transactionsCollection.delete(tx.public_id);
    onDelete?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const formFields = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            disabled={isRecurringCategory || isRecurringPrefill}
            onClick={() => {
              const newType = type === "income" ? "expense" : "income";
              patch({ type: newType, category_id: null });
              setCategoryInputValue("");
            }}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-medium transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 ${isRecurringCategory || isRecurringPrefill ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-75"} ${type === "income" ? "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"}`}
          >
            {type === "income" ? "Income" : "Expense"}
          </button>
          <div className="min-w-0">
            <Autocomplete.Root
              items={filteredCategories}
              value={categoryInputValue}
              openOnInputClick
              onValueChange={(val: string) => {
                setCategoryInputValue(val);
                const match = filteredCategories.find((c) => c.name === val);
                patch({
                  category_id: match ? match.id : val.trim() ? -1 : null,
                });
              }}
              itemToStringValue={(c: Category) => c.name}
              disabled={isRecurringCategory || isRecurringPrefill}
            >
              <Autocomplete.Input
                placeholder="Category"
                className={`w-full min-w-0 appearance-none rounded-lg bg-zinc-100 py-1.5 pr-3 pl-3 text-sm font-medium text-zinc-800 outline-none placeholder:text-zinc-500 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400 ${isRecurringCategory || isRecurringPrefill ? "cursor-not-allowed opacity-60" : ""}`}
              />
              <Autocomplete.Portal>
                <Autocomplete.Positioner sideOffset={6}>
                  <Autocomplete.Popup className="z-50 w-(--anchor-width) overflow-hidden rounded-lg bg-white p-1 shadow-md ring-1 ring-zinc-200 data-empty:hidden dark:bg-zinc-800 dark:ring-zinc-700">
                    <Autocomplete.List className="max-h-60 overflow-y-auto">
                      {(c: Category) => (
                        <Autocomplete.Item
                          key={c.id}
                          value={c}
                          className="relative flex w-full cursor-default items-center rounded-md px-2 py-1.5 text-sm text-zinc-800 outline-none select-none data-highlighted:bg-zinc-100 dark:text-zinc-100 dark:data-highlighted:bg-zinc-700"
                        >
                          {c.name}
                        </Autocomplete.Item>
                      )}
                    </Autocomplete.List>
                  </Autocomplete.Popup>
                </Autocomplete.Positioner>
              </Autocomplete.Portal>
            </Autocomplete.Root>
          </div>
        </div>
      </div>

      <div className="flex items-baseline gap-1 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
        <span className="text-2xl font-semibold text-zinc-400 dark:text-zinc-500">
          $
        </span>
        <input
          ref={amountInputRef}
          type="text"
          inputMode="numeric"
          value={
            form.amount === ""
              ? ""
              : Number(form.amount).toLocaleString("en-US")
          }
          placeholder="0"
          autoFocus={focusOnMount}
          onKeyDown={(e) => {
            const input = amountInputRef.current;
            if (!input) return;
            const cursor = input.selectionStart ?? 0;
            const selEnd = input.selectionEnd ?? 0;
            const value = input.value;
            // no selection: if key would land on a comma, skip it
            if (cursor === selEnd) {
              if (e.key === "Backspace" && value[cursor - 1] === ",") {
                e.preventDefault();
                // delete the digit before the comma
                const raw = value.replace(/,/g, "");
                const rawCursor =
                  cursor - (value.slice(0, cursor).match(/,/g) ?? []).length;
                const newRaw =
                  raw.slice(0, rawCursor - 1) + raw.slice(rawCursor);
                if (newRaw === "" || /^\d+$/.test(newRaw)) {
                  patch({ amount: newRaw });
                  requestAnimationFrame(() => {
                    if (!amountInputRef.current) return;
                    const formatted =
                      newRaw === ""
                        ? ""
                        : Number(newRaw).toLocaleString("en-US");
                    const targetRawCursor = rawCursor - 1;
                    let digits = 0,
                      pos = formatted.length;
                    for (let i = 0; i < formatted.length; i++) {
                      if (digits === targetRawCursor) {
                        pos = i;
                        break;
                      }
                      if (formatted[i] !== ",") digits++;
                    }
                    amountInputRef.current.setSelectionRange(pos, pos);
                  });
                }
              } else if (e.key === "Delete" && value[cursor] === ",") {
                e.preventDefault();
                const raw = value.replace(/,/g, "");
                const rawCursor =
                  cursor - (value.slice(0, cursor).match(/,/g) ?? []).length;
                const newRaw =
                  raw.slice(0, rawCursor) + raw.slice(rawCursor + 1);
                if (newRaw === "" || /^\d+$/.test(newRaw)) {
                  patch({ amount: newRaw });
                  requestAnimationFrame(() => {
                    if (!amountInputRef.current) return;
                    const formatted =
                      newRaw === ""
                        ? ""
                        : Number(newRaw).toLocaleString("en-US");
                    let digits = 0,
                      pos = formatted.length;
                    for (let i = 0; i < formatted.length; i++) {
                      if (digits === rawCursor) {
                        pos = i;
                        break;
                      }
                      if (formatted[i] !== ",") digits++;
                    }
                    amountInputRef.current.setSelectionRange(pos, pos);
                  });
                }
              }
            }
          }}
          onChange={(e) => {
            const input = e.target;
            const cursorBefore = input.selectionStart ?? 0;
            const commasBefore = (
              input.value.slice(0, cursorBefore).match(/,/g) ?? []
            ).length;
            const rawCursor = cursorBefore - commasBefore;
            const raw = input.value.replace(/,/g, "");
            if (raw !== "" && !/^\d+$/.test(raw)) return;
            patch({ amount: raw });
            requestAnimationFrame(() => {
              if (!amountInputRef.current) return;
              const formatted =
                raw === "" ? "" : Number(raw).toLocaleString("en-US");
              let digits = 0,
                pos = formatted.length;
              for (let i = 0; i < formatted.length; i++) {
                if (digits === rawCursor) {
                  pos = i;
                  break;
                }
                if (formatted[i] !== ",") digits++;
              }
              amountInputRef.current.setSelectionRange(pos, pos);
            });
          }}
          className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        />
      </div>

      <input
        type="text"
        value={form.description}
        onChange={(e) => patch({ description: e.target.value })}
        placeholder="Note (optional)"
        className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-500 outline-none placeholder:text-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:placeholder:text-zinc-500"
      />

      <div className="flex h-8 items-center justify-between gap-4 pt-1">
        <div>
          {(isRecurringPrefill || isRecurringCategory) && (
            <span className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <svg
                className="shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              Recurring
            </span>
          )}
          {!isRecurringPrefill && !isRecurringCategory && (
            <label className="flex min-w-0 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.recurrent}
                onChange={(e) => patch({ recurrent: e.target.checked })}
                className="sr-only"
              />
              <div
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${form.recurrent ? "bg-zinc-600 dark:bg-zinc-50" : "bg-zinc-200 dark:bg-zinc-700"}`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform dark:bg-zinc-900 ${form.recurrent ? "translate-x-4" : "translate-x-0"}`}
                />
              </div>
              <span
                className={`truncate text-sm ${form.recurrent ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-600"}`}
              >
                Recurring {form.recurrent ? "on" : "off"}
              </span>
            </label>
          )}
        </div>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white transition-opacity disabled:opacity-30 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {tx ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </>
  );

  if (!tx) {
    return (
      <div
        className={`group relative -mt-px overflow-hidden border border-zinc-300 hover:z-10 dark:border-zinc-700 ${isFirst ? "mt-0 rounded-t-xl" : ""} ${isLast ? "rounded-b-xl" : ""}`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
          {formFields}
        </form>
      </div>
    );
  }

  const isIncome = tx.amount >= 0;
  const categoryName = tx.category_id
    ? categoriesById[tx.category_id]?.name
    : null;

  const summary = (
    <>
      {categoryName && !nested && (
        <span className="shrink-0 text-[15px] text-zinc-500 dark:text-zinc-400">
          {categoryName}
        </span>
      )}
      {tx.description && (
        <span className="min-w-0 truncate text-[15px] text-zinc-400 dark:text-zinc-500">
          {tx.description}
        </span>
      )}
      <span
        className={`ml-auto shrink-0 text-[15px] font-semibold ${isIncome ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
      >
        {isIncome ? "+" : "-"}$
        {Math.abs(tx.amount).toLocaleString("en-US")}
      </span>
    </>
  );

  return (
    <>
      <ExpandableRow
        summary={summary}
        isFirst={isFirst}
        isLast={isLast}
        nested={nested}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
          {formFields}
        </form>
      </ExpandableRow>

      <dialog
        ref={confirmDialogRef}
        className="fixed top-1/2 left-1/2 m-0 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <p className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Delete transaction?
        </p>
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
          <div className="flex min-w-0 items-center gap-2">
            {tx.category_id && (
              <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {categoriesById[tx.category_id]?.name}
              </span>
            )}
            {tx.description && (
              <span className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                · {tx.description}
              </span>
            )}
          </div>
          <span
            className={`shrink-0 text-sm font-semibold ${tx.amount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
          >
            {tx.amount >= 0 ? "+" : "-"}$
            {Math.abs(tx.amount).toLocaleString("en-US")}
          </span>
        </div>
        <p className="mb-5 text-xs text-zinc-500 dark:text-zinc-400">
          {tx.recurrent
            ? "This will only delete this entry, not future ones."
            : "This action cannot be undone."}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => confirmDialogRef.current?.close()}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </dialog>
    </>
  );
}
