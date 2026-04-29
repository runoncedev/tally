import { useState } from "react";

type ExpandableRowProps = {
  summary: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  isFirst?: boolean;
  isLast?: boolean;
  defaultExpanded?: boolean;
  nested?: boolean;
  dimSummaryWhenOpen?: boolean;
};

export function ExpandableRow({
  summary,
  children,
  isFirst = false,
  isLast = false,
  defaultExpanded = false,
  nested = false,
  dimSummaryWhenOpen = false,
}: ExpandableRowProps) {
  const [open, setOpen] = useState(defaultExpanded);

  return (
    <div
      className={
        nested
          ? `group relative bg-zinc-50 dark:bg-zinc-800/40 ${isFirst ? "" : "border-t border-zinc-200 dark:border-zinc-700"}`
          : `group relative -mt-px overflow-clip border border-zinc-300 focus-within:z-10 hover:z-10 dark:border-zinc-700 ${isFirst ? "mt-0 rounded-t-xl" : ""} ${isLast ? "rounded-b-xl" : ""}`
      }
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-3 py-3 pr-4 text-left transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none dark:hover:bg-zinc-800/50 dark:focus-visible:bg-zinc-800/50 ${nested ? "pl-8" : "pl-4"}`}
      >
        <div className={`flex min-w-0 flex-1 items-center gap-3 transition-opacity duration-300 ${dimSummaryWhenOpen && open ? "opacity-40" : ""}`}>
          {summary}
        </div>
      </button>
      <div
        style={{
          ...(({ interpolateSize: "allow-keywords" } as React.CSSProperties)),
          height: open ? "auto" : 0,
        }}
        className="overflow-hidden transition-[height] duration-300 ease-in-out"
        inert={!open ? true : undefined}
      >
        {typeof children === "function" ? children(() => setOpen(false)) : children}
      </div>
    </div>
  );
}
