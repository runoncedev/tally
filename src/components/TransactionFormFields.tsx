import { Autocomplete } from "@base-ui/react/autocomplete";
import type { Category } from "../lib/collections";
import { useAmountInput } from "../hooks/useAmountInput";

export type TransactionFieldsState = {
  amount: string;
  category_id: number | null;
  type: "income" | "expense";
  description: string;
};

type Props = {
  form: TransactionFieldsState;
  onPatch: (p: Partial<TransactionFieldsState>) => void;
  categories: Category[];
  categoryInputValue: string;
  onCategoryInputChange: (val: string) => void;
  canSave: boolean;
  isRecurringPrefill?: boolean;
  isRecurringCategory?: boolean;
  isEditing?: boolean;
  focusOnMount?: boolean;
  showDelete?: boolean;
  cancelLabel?: string;
  onDelete?: () => void;
  onCancel: () => void;
};

export function TransactionFormFields({
  form,
  onPatch,
  categories,
  categoryInputValue,
  onCategoryInputChange,
  canSave,
  isRecurringPrefill = false,
  isRecurringCategory = false,
  isEditing = false,
  focusOnMount = false,
  showDelete = false,
  cancelLabel = "Cancel",
  onDelete,
  onCancel,
}: Props) {
  const { type } = form;
  const filteredCategories = categories.filter((c) => c.type === type);

  const amount = useAmountInput(form.amount, (raw) => onPatch({ amount: raw }));

  return (
    <>
      {!isRecurringCategory && !isRecurringPrefill && (
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const newType = type === "income" ? "expense" : "income";
                onPatch({ type: newType, category_id: null });
                onCategoryInputChange("");
              }}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-medium transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 cursor-pointer hover:opacity-75 ${type === "income" ? "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"}`}
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
                  onPatch({
                    category_id: match ? match.id : val.trim() ? -1 : null,
                  });
                }}
                itemToStringValue={(c: Category) => c.name}
              >
                <Autocomplete.Input
                  placeholder="Category"
                  className="w-full min-w-0 appearance-none rounded-lg bg-zinc-100 py-1.5 pr-3 pl-3 text-sm font-medium text-zinc-800 outline-none placeholder:text-zinc-500 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
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
      )}

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
