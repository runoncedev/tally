import type { Category, Transaction } from "../lib/collections";
import { ExpandableRow } from "./ExpandableRow";
import { TransactionForm } from "./TransactionForm";
import type { TransactionFormPayload } from "./TransactionForm";

type GroupRowProps = {
  categoryId: number | null;
  total: number;
  rows: Transaction[];
  categories: Category[];
  categoriesById: Record<number, Category>;
  month: string;
  activeRecurringIds: Set<string>;
  isFirst?: boolean;
  isLast?: boolean;
  onSubmit?: (payload: TransactionFormPayload) => void;
  onDelete?: (publicId: string) => void;
};

export function GroupRow({
  categoryId,
  total,
  rows,
  categories,
  categoriesById,
  month,
  activeRecurringIds,
  isFirst = false,
  isLast = false,
  onSubmit,
  onDelete,
}: GroupRowProps) {
  const category = categoryId != null ? categoriesById[categoryId] : null;
  const isIncome = total >= 0;

  const summary = (
    <>
      <span className="shrink-0 text-[15px] font-medium text-zinc-600 dark:text-zinc-300">
        {category?.name ?? "Uncategorized"}
      </span>
      <span
        className={`ml-auto shrink-0 text-[15px] font-semibold ${isIncome ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
      >
        {isIncome ? "+" : "-"}${Math.abs(total).toLocaleString("en-US")}
      </span>
    </>
  );

  return (
    <ExpandableRow summary={summary} isFirst={isFirst} isLast={isLast}>
      <div className="border-t border-zinc-200 dark:border-zinc-700">
        {rows.map((tx, i) => (
          <TransactionForm
            key={tx.public_id}
            tx={tx}
            categories={categories}
            month={month}
            categoriesById={categoriesById}
            isRecurringCategory={
              tx.recurring_source_id != null &&
              activeRecurringIds.has(tx.recurring_source_id)
            }
            isFirst={i === 0}
            isLast={i === rows.length - 1}
            nested
            onSubmit={onSubmit}
            onDelete={() => onDelete?.(tx.public_id)}
            hideMonthInDeleteDialog
          />
        ))}
      </div>
    </ExpandableRow>
  );
}
