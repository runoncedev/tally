import type { Category, Transaction } from "../lib/collections";
import { ExpandableRow } from "./ExpandableRow";
import { TransactionForm } from "./TransactionForm";
import type { TransactionFormPayload } from "./TransactionForm";

type TransactionRowProps = {
  tx: Transaction;
  categories: Category[];
  month: string;
  categoriesById: Record<number, Category>;
  isFirst?: boolean;
  isLast?: boolean;
  nested?: boolean;
  childCount?: number;
  isRecurringCategory?: boolean;
  confirmOnSave?: boolean;
  cancelLabel?: string;
  hideMonthInDeleteDialog?: boolean;
  onSubmit?: (payload: TransactionFormPayload) => void;
  onDelete?: () => void;
};

export function TransactionRow({
  tx,
  categories,
  month,
  categoriesById,
  isFirst = false,
  isLast = false,
  nested = false,
  childCount,
  isRecurringCategory = false,
  confirmOnSave = false,
  cancelLabel,
  hideMonthInDeleteDialog = false,
  onSubmit,
  onDelete,
}: TransactionRowProps) {
  const isIncome = tx.amount >= 0;
  const categoryName = tx.category_id ? categoriesById[tx.category_id]?.name : null;

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
        {isIncome ? "+" : "-"}${Math.abs(tx.amount).toLocaleString("en-US")}
      </span>
    </>
  );

  return (
    <ExpandableRow
      summary={summary}
      isFirst={isFirst}
      isLast={isLast}
      nested={nested}
      dimSummaryWhenOpen
    >
      {(close) => (
        <TransactionForm
          tx={tx}
          categories={categories}
          month={month}
          categoriesById={categoriesById}
          isRecurringCategory={isRecurringCategory}
          confirmOnSave={confirmOnSave}
          cancelLabel={cancelLabel}
          hideMonthInDeleteDialog={hideMonthInDeleteDialog}
          onSubmit={onSubmit}
          onDelete={onDelete}
          onClose={close}
        />
      )}
    </ExpandableRow>
  );
}
