import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Category, Transaction } from "../lib/collections";
import { ExpandableRow } from "./ExpandableRow";
import { TransactionFormFields, type TransactionFieldsState } from "./TransactionFormFields";


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
  nested?: boolean;
  confirmOnSave?: boolean;
  cancelLabel?: string;
  bare?: boolean;
  childCount?: number;
  onSaved?: () => void;
  onDelete?: () => void;
  onSubmit?: (payload: TransactionFormPayload) => void;
  hideMonthInDeleteDialog?: boolean;
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
  nested = false,
  confirmOnSave = false,
  cancelLabel,
  bare = false,
  childCount,
  onSaved,
  onDelete,
  onSubmit,
  hideMonthInDeleteDialog = false,
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
        prefillDate,
      ),
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

  const handleCancel = (close: () => void) => {
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
      close();
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

  const formFields = (close: () => void) => (
    <TransactionFormFields
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
      onCancel={() => handleCancel(close)}
    />
  );

  if (!tx) {
    return (
      <div
        className={bare ? "" : `group relative -mt-px overflow-hidden border border-zinc-300 hover:z-10 dark:border-zinc-700 ${isFirst ? "mt-0 rounded-t-xl" : ""} ${isLast ? "rounded-b-xl" : ""}`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
          {formFields(() => onDelete?.())}
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
      {!nested && childCount != null && (
        <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
          {childCount} {childCount === 1 ? "entry" : "entries"}
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
        dimSummaryWhenOpen
      >
        {(close) => (
          <form onSubmit={handleSubmit} className="group/form flex flex-col gap-3 p-4">
            {formFields(close)}
          </form>
        )}
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
          {hideMonthInDeleteDialog ? (
            <>This action cannot be undone.</>
          ) : (
            <>This will delete the transaction from <Link to="/month/$month" params={{ month: tx.date.slice(0, 7) }} className="underline underline-offset-2 hover:opacity-75">{tx.date.slice(0, 7)}</Link>. This action cannot be undone.</>
          )}
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

      <dialog
        ref={confirmSaveDialogRef}
        className="fixed top-1/2 left-1/2 m-0 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <p className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Save changes?
        </p>
        <p className="mb-5 text-xs text-zinc-500 dark:text-zinc-400">
          This will update the entry from{" "}
          {tx && <Link to="/month/$month" params={{ month: tx.date.slice(0, 7) }} className="underline underline-offset-2 hover:opacity-75">{tx.date.slice(0, 7)}</Link>}.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => confirmSaveDialogRef.current?.close()}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { confirmSaveDialogRef.current?.close(); commitSave(); }}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white transition-colors hover:opacity-90 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Save
          </button>
        </div>
      </dialog>
    </>
  );
}
