import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Autocomplete } from "@base-ui/react/autocomplete";
import type { Category, Transaction } from "../lib/collections";
import { useAmountInput } from "../hooks/useAmountInput";

// ─── TransactionForm.Fields ───────────────────────────────────────────────────

export type TransactionFieldsState = {
  date: string;
  amount: string;
  category_id: number | null;
  type: "income" | "expense";
  description: string;
};

type FieldsProps = {
  form: TransactionFieldsState;
  onPatch: (p: Partial<TransactionFieldsState>) => void;
  categories: Category[];
  categoryInputValue: string;
  onCategoryInputChange: (val: string) => void;
  canSave: boolean;
  isRecurringPrefill?: boolean;
  isRecurringCategory?: boolean;
  dateDisabled?: boolean;
  isEditing?: boolean;
  focusOnMount?: boolean;
  showDelete?: boolean;
  cancelLabel?: string;
  onDelete?: () => void;
  onCancel: () => void;
};

function Fields({
  form,
  onPatch,
  categories,
  categoryInputValue,
  onCategoryInputChange,
  canSave,
  isRecurringPrefill = false,
  isRecurringCategory = false,
  dateDisabled = false,
  isEditing = false,
  focusOnMount = false,
  showDelete = false,
  cancelLabel = "Cancel",
  onDelete,
  onCancel,
}: FieldsProps) {
  const { type } = form;
  const filteredCategories = categories.filter((c) => c.type === type);
  const datePickerRef = useRef<HTMLInputElement>(null);
  const dateObj = form.date ? new Date(form.date + "T12:00:00") : null;
  const dayShort = dateObj
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(dateObj)
    : null;

  const amount = useAmountInput(form.amount, (raw) => onPatch({ amount: raw }));

  return (
    <>
      <div className="flex items-center gap-2">
        <div className={`flex min-w-0 flex-1 items-center gap-2 ${isRecurringCategory || isRecurringPrefill ? "opacity-40" : ""}`}>
          <button
            type="button"
            disabled={isRecurringCategory || isRecurringPrefill}
            onClick={() => {
              const newType = type === "income" ? "expense" : "income";
              onPatch({ type: newType, category_id: null });
              onCategoryInputChange("");
            }}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-medium transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 ${isRecurringCategory || isRecurringPrefill ? "cursor-default" : "cursor-pointer hover:opacity-75"} ${type === "income" ? "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"}`}
          >
            {type === "income" ? "Income" : "Expense"}
          </button>
          <div className="min-w-0">
            <Autocomplete.Root
              items={filteredCategories}
              value={categoryInputValue}
              openOnInputClick
              onValueChange={(val: string) => {
                onCategoryInputChange(val);
                const match = filteredCategories.find((c) => c.name === val);
                onPatch({ category_id: match ? match.id : val.trim() ? -1 : null });
              }}
              itemToStringValue={(c: Category) => c.name}
            >
              <Autocomplete.Input
                placeholder="Category"
                disabled={isRecurringCategory || isRecurringPrefill}
                className="w-full min-w-0 appearance-none rounded-lg bg-zinc-100 py-1.5 pr-3 pl-3 text-sm font-medium text-zinc-800 outline-none placeholder:text-zinc-500 disabled:cursor-default dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
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
        <div className="relative ml-auto shrink-0">
          <button
            type="button"
            disabled={dateDisabled}
            onClick={() => !dateDisabled && datePickerRef.current?.showPicker()}
            className={`flex items-center gap-2.5 rounded-lg p-2.5 text-sm font-medium leading-none text-zinc-400 transition-colors dark:text-zinc-500 ${dateDisabled ? "cursor-default" : "hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"}`}
          >
            {dayShort}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden sm:block">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
          <input
            ref={datePickerRef}
            type="date"
            value={form.date}
            onChange={(e) => onPatch({ date: e.target.value })}
            tabIndex={-1}
            className="pointer-events-none absolute inset-0 w-full opacity-0"
          />
        </div>
      </div>

      <div className="flex items-baseline gap-1 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
        <span className="text-2xl font-semibold text-zinc-400 dark:text-zinc-500">$</span>
        <input
          ref={amount.ref}
          type="text"
          inputMode="numeric"
          value={amount.displayValue}
          placeholder="0"
          autoFocus={focusOnMount}
          onKeyDown={amount.onKeyDown}
          onChange={amount.onChange}
          className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        />
      </div>

      <input
        type="text"
        value={form.description}
        onChange={(e) => onPatch({ description: e.target.value })}
        placeholder="Note (optional)"
        className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-500 outline-none placeholder:text-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:placeholder:text-zinc-500"
      />

      <div className="flex h-8 items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-2">
          {(isRecurringPrefill || isRecurringCategory) && (
            <span className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <svg className="shrink-0" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              Recurring
            </span>
          )}
          {showDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800 sm:opacity-0 sm:transition-opacity sm:delay-0 sm:group-hover/form:opacity-100 sm:group-hover/form:delay-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          )}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white transition-opacity disabled:opacity-30 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {isEditing ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── TransactionForm ──────────────────────────────────────────────────────────

export type TransactionFormPayload = {
  date: string;
  amount: number;
  category_id: number | null;
  categoryName: string | null;
  description: string | null;
  public_id: string;
};

type TransactionFormProps = {
  tx?: Transaction;
  categories: Category[];
  month: string;
  categoriesById: Record<number, Category>;
  prefillCategoryId?: number;
  prefillCategoryType?: "income" | "expense";
  prefillAmount?: number;
  prefillDescription?: string;
  prefillDate?: string;
  dateDisabled?: boolean;
  initialType?: "income" | "expense";
  publicId?: string;
  focusOnMount?: boolean;
  isRecurringPrefill?: boolean;
  initiallyDirty?: boolean;
  isRecurringCategory?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  bare?: boolean;
  confirmOnSave?: boolean;
  cancelLabel?: string;
  hideMonthInDeleteDialog?: boolean;
  onSaved?: () => void;
  onDelete?: () => void;
  onSubmit?: (payload: TransactionFormPayload) => void;
  onClose?: () => void;
};

type FormState = TransactionFieldsState;

function txToForm(tx: Transaction): FormState {
  return {
    date: tx.date.slice(0, 10),
    amount: String(Math.abs(tx.amount)),
    category_id: tx.category_id,
    type: tx.amount >= 0 ? "income" : "expense",
    description: tx.description ?? "",
  };
}

function emptyForm(
  month: string,
  prefillCategoryId?: number,
  prefillCategoryType?: "income" | "expense",
  prefillAmount?: number,
  prefillDescription?: string,
  prefillDate?: string,
): FormState {
  return {
    date: prefillDate ?? (() => {
      const today = new Date().toISOString().slice(0, 10);
      return today.startsWith(month) ? today : `${month}-01`;
    })(),
    amount: prefillAmount != null ? String(prefillAmount) : "",
    category_id: prefillCategoryId ?? null,
    type: prefillCategoryType ?? "expense",
    description: prefillDescription ?? "",
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
  prefillDate,
  dateDisabled = false,
  initialType,
  publicId,
  focusOnMount = false,
  isRecurringPrefill = false,
  initiallyDirty = false,
  isRecurringCategory = false,
  isFirst = false,
  isLast = false,
  bare = false,
  confirmOnSave = false,
  cancelLabel,
  hideMonthInDeleteDialog = false,
  onSaved,
  onDelete,
  onSubmit,
  onClose,
}: TransactionFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    tx
      ? txToForm(tx)
      : emptyForm(month, prefillCategoryId, prefillCategoryType ?? initialType, prefillAmount, prefillDescription, prefillDate),
  );
  const [isDirty, setIsDirty] = useState(initiallyDirty);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const confirmSaveDialogRef = useRef<HTMLDialogElement>(null);

  const patch = (p: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...p }));
    setIsDirty(true);
  };

  const [categoryInputValue, setCategoryInputValue] = useState(() => {
    if (form.category_id === null) return "";
    return categories.find((c) => c.id === form.category_id)?.name ?? "";
  });

  const canSave = (isDirty || isRecurringPrefill) && form.amount !== "";

  const commitSave = () => {
    if (!canSave) return;
    const rawAmount = parseInt(form.amount, 10);
    if (isNaN(rawAmount)) return;
    const amount = form.type === "expense" ? -rawAmount : rawAmount;
    onSubmit?.({
      date: form.date,
      amount,
      category_id: form.category_id,
      categoryName: form.category_id === -1 ? categoryInputValue.trim() : null,
      description: form.description || null,
      public_id: tx?.public_id ?? publicId ?? crypto.randomUUID(),
    });
    if (!tx) {
      onSaved?.();
    } else {
      setIsDirty(false);
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    if (confirmOnSave && isDirty) {
      confirmSaveDialogRef.current?.showModal();
      return;
    }
    commitSave();
  };

  const handleCancel = () => {
    if (!tx) {
      onDelete?.();
    } else {
      setForm(txToForm(tx));
      setCategoryInputValue(
        tx.category_id ? (categories.find((c) => c.id === tx.category_id)?.name ?? "") : "",
      );
      setIsDirty(false);
      onClose?.();
    }
  };

  const handleDelete = () => {
    if (!tx) return;
    confirmDialogRef.current?.showModal();
  };

  const handleConfirmDelete = () => {
    confirmDialogRef.current?.close();
    onDelete?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <>
      <div
        className={tx || bare ? "group/form p-4" : `group relative -mt-px overflow-hidden border border-zinc-300 hover:z-10 dark:border-zinc-700 ${isFirst ? "mt-0 rounded-t-xl" : ""} ${isLast ? "rounded-b-xl" : ""}`}
      >
        <form onSubmit={handleSubmit} className={tx || bare ? "flex flex-col gap-3" : "flex flex-col gap-3 p-4"}>
          <TransactionForm.Fields
            form={form}
            onPatch={patch}
            categories={categories}
            categoryInputValue={categoryInputValue}
            onCategoryInputChange={setCategoryInputValue}
            canSave={canSave}
            isRecurringPrefill={isRecurringPrefill}
            isRecurringCategory={isRecurringCategory}
            dateDisabled={dateDisabled}
            isEditing={!!tx}
            focusOnMount={focusOnMount}
            showDelete={!!tx}
            cancelLabel={cancelLabel}
            onDelete={handleDelete}
            onCancel={handleCancel}
          />
        </form>
      </div>

      <dialog
        ref={confirmDialogRef}
        className="fixed top-1/2 left-1/2 m-0 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <p className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Delete transaction?</p>
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
          <div className="flex min-w-0 items-center gap-2">
            {tx?.category_id && (
              <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {categoriesById[tx.category_id]?.name}
              </span>
            )}
            {tx?.description && (
              <span className="truncate text-xs text-zinc-400 dark:text-zinc-500">· {tx.description}</span>
            )}
          </div>
          {tx && (
            <span className={`shrink-0 text-sm font-semibold ${tx.amount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
              {tx.amount >= 0 ? "+" : "-"}${Math.abs(tx.amount).toLocaleString("en-US")}
            </span>
          )}
        </div>
        <p className="mb-5 text-xs text-zinc-500 dark:text-zinc-400">
          {hideMonthInDeleteDialog || !tx ? (
            <>This action cannot be undone.</>
          ) : (
            <>This will delete the transaction from{" "}
              <Link to="/month/$month" params={{ month: tx.date.slice(0, 7) }} className="underline underline-offset-2 hover:opacity-75">
                {tx.date.slice(0, 7)}
              </Link>. This action cannot be undone.</>
          )}
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => confirmDialogRef.current?.close()} className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
            Cancel
          </button>
          <button type="button" onClick={handleConfirmDelete} className="rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-600">
            Delete
          </button>
        </div>
      </dialog>

      <dialog
        ref={confirmSaveDialogRef}
        className="fixed top-1/2 left-1/2 m-0 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <p className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Save changes?</p>
        <p className="mb-5 text-xs text-zinc-500 dark:text-zinc-400">
          This will update the entry from{" "}
          {tx && (
            <Link to="/month/$month" params={{ month: tx.date.slice(0, 7) }} className="underline underline-offset-2 hover:opacity-75">
              {tx.date.slice(0, 7)}
            </Link>
          )}.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => confirmSaveDialogRef.current?.close()} className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
            Cancel
          </button>
          <button type="button" onClick={() => { confirmSaveDialogRef.current?.close(); commitSave(); }} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white transition-colors hover:opacity-90 dark:bg-zinc-50 dark:text-zinc-900">
            Save
          </button>
        </div>
      </dialog>
    </>
  );
}

TransactionForm.Fields = Fields;
