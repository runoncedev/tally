import { useRef } from "react";
import type { Category, EmailTransaction } from "../lib/collections";
import { ExpandableRow } from "./ExpandableRow";
import type { TransactionFormPayload } from "./TransactionForm";
import { TransactionForm } from "./TransactionForm";

type EmailTransactionRowProps = {
  emailTx: EmailTransaction;
  categories: Category[];
  categoriesById: Record<number, Category>;
  isFirst?: boolean;
  isLast?: boolean;
  prefillCategoryId?: number;
  onSave: (payload: TransactionFormPayload) => void;
  onDiscard: () => void;
};

export function EmailTransactionRow({
  emailTx,
  categories,
  categoriesById,
  isFirst = false,
  isLast = false,
  prefillCategoryId,
  onSave,
  onDiscard,
}: EmailTransactionRowProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const amount = emailTx.amount != null ? Math.abs(emailTx.amount) : undefined;
  const month = emailTx.transacted_at
    ? emailTx.transacted_at.slice(0, 7)
    : new Date().toISOString().slice(0, 7);

  const dateLabel = emailTx.transacted_at
    ? (() => {
      const d = new Date(emailTx.transacted_at);
      const day = d.getDate();
      const time = d.toLocaleTimeString("default", { hour: "numeric", minute: "2-digit" });
      return `${day} · ${time}`;
    })()
    : null;

  const summary = (
    <>
      {dateLabel && (
        <span className="shrink-0 text-[15px] text-zinc-500 dark:text-zinc-400">
          {dateLabel}
        </span>
      )}
      <span className="min-w-0 truncate text-[15px] font-medium text-zinc-800 dark:text-zinc-100">
        {emailTx.merchant ?? "Unknown"}
      </span>
      {amount != null && (
        <span className="ml-auto shrink-0 text-[15px] font-semibold text-red-500 dark:text-red-400">
          -${amount.toLocaleString("en-US")}
        </span>
      )}
    </>
  );

  return (
    <>
      <ExpandableRow summary={summary} isFirst={isFirst} isLast={isLast} dimSummaryWhenOpen>
        {(close) => (
          <div>
            <TransactionForm
              categories={categories}
              month={month}
              categoriesById={categoriesById}
              prefillCategoryId={prefillCategoryId}
              prefillAmount={amount}
              prefillDescription={emailTx.merchant ?? undefined}
              prefillDate={emailTx.transacted_at ? emailTx.transacted_at.slice(0, 10) : undefined}
              dateDisabled
              prefillCategoryType="expense"
              initiallyDirty
              bare
              cancelLabel="Discard"
              onSubmit={(payload) => { onSave(payload); close(); }}
              onDelete={() => dialogRef.current?.showModal()}
            />
            {emailTx.from && (
              <p className="px-4 pt-1 pb-3 text-zinc-400 dark:text-zinc-500">
                Via {emailTx.from}
              </p>
            )}
          </div>
        )}
      </ExpandableRow>

      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 m-0 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <p className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Discard transaction?
        </p>
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
          <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {emailTx.merchant ?? "Unknown"}
          </span>
          {amount != null && (
            <span className="shrink-0 text-sm font-semibold text-red-500 dark:text-red-400">
              -${amount.toLocaleString("en-US")}
            </span>
          )}
        </div>
        <p className="mb-5 text-xs text-zinc-500 dark:text-zinc-400">
          This will remove the transaction from your inbox. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { dialogRef.current?.close(); onDiscard(); }}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-600"
          >
            Discard
          </button>
        </div>
      </dialog>
    </>
  );
}
