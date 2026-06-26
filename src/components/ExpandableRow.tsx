import { useState } from "react";

type ExpandableRowProps = {
  summary: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  isFirst?: boolean;
  isLast?: boolean;
  defaultExpanded?: boolean;
  nested?: boolean;
  dimSummaryWhenOpen?: boolean;
  readOnly?: boolean;
};

export function ExpandableRow({
  summary,
  children,
  isFirst = false,
  isLast = false,
  defaultExpanded = false,
  nested = false,
  dimSummaryWhenOpen = false,
  readOnly = false,
}: ExpandableRowProps) {
  const [open, setOpen] = useState(defaultExpanded);
  const [animating, setAnimating] = useState(false);

  return (
    <div
      className={
        nested
          ? `group relative bg-zinc-50 dark:bg-zinc-800/40 ${isFirst ? "" : "border-t border-zinc-200 dark:border-zinc-700"}`
          : `group relative -mt-px border border-zinc-300 dark:border-zinc-700 ${open && !animating ? "overflow-hidden" : "overflow-clip focus-within:z-10 hover:z-10"} ${isFirst ? "mt-0 rounded-t-xl" : ""} ${isLast ? "rounded-b-xl" : ""}`
      }
    >
      {readOnly ? (
        <div className={`flex w-full items-center gap-3 py-3 pr-4 ${nested ? "pl-8" : "pl-4"}`}>
          <div className="flex min-w-0 flex-1 items-center gap-3">{summary}</div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setOpen((o) => !o); setAnimating(true); }}
          className={`flex w-full items-center gap-3 py-3 pr-4 text-left transition-colors focus-visible:outline-none ${nested ? "pl-8 hover:bg-zinc-100 focus-visible:bg-zinc-100 dark:hover:bg-zinc-700/40 dark:focus-visible:bg-zinc-700/40" : "pl-4 hover:bg-zinc-50 focus-visible:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:focus-visible:bg-zinc-800/50"}`}
        >
          <div className={`flex min-w-0 flex-1 items-center gap-3 transition-opacity duration-300 ${dimSummaryWhenOpen && open ? "opacity-40" : ""}`}>
            {summary}
          </div>
        </button>
      )}
      {!readOnly && (
        <div
          style={{
            ...(({ interpolateSize: "allow-keywords" } as React.CSSProperties)),
            height: open ? "auto" : 0,
          }}
          className={`transition-[height] duration-300 ease-in-out ${open && !animating ? "overflow-visible" : "overflow-hidden"}`}
          onTransitionEnd={() => setAnimating(false)}
          inert={!open ? true : undefined}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}
