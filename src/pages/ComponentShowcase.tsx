import { useState } from "react";
import { Button, ButtonLink } from "../components/Button";
import { CurrencyFlow } from "../components/CurrencyFlow";
import { ExpandableRow } from "../components/ExpandableRow";
import { MonthCard } from "../components/MonthCard";

import { TransactionForm } from "../components/TransactionForm";
import type { TransactionFormPayload } from "../components/TransactionForm";
import { TransactionRow } from "../components/TransactionRow";
import { GroupRow } from "../components/GroupRow";
import { EmailTransactionRow } from "../components/EmailTransactionRow";

const DEMO_CATEGORIES = [
  { id: 1, name: "Salary", type: "income" as const, created_at: "", household_id: null, recurring: false, default_amount: null },
  { id: 2, name: "Rent", type: "expense" as const, created_at: "", household_id: null, recurring: false, default_amount: null },
  { id: 3, name: "Groceries", type: "expense" as const, created_at: "", household_id: null, recurring: false, default_amount: null },
  { id: 4, name: "Dining", type: "expense" as const, created_at: "", household_id: null, recurring: false, default_amount: null },
];

const DEMO_CATEGORIES_BY_ID = Object.fromEntries(DEMO_CATEGORIES.map((c) => [c.id, c]));

const DEMO_TRANSACTIONS = [
  { public_id: "demo-tx-1", amount: -85, category_id: 3, description: "Whole Foods", date: "2026-06-01", household_id: null, via: null },
  { public_id: "demo-tx-2", amount: -42, category_id: 3, description: "Trader Joe's", date: "2026-06-03", household_id: null, via: null },
  { public_id: "demo-tx-3", amount: -1500, category_id: 2, description: null, date: "2026-06-01", household_id: null, via: null },
];



function TransactionFormDemo() {
  const [submitted, setSubmitted] = useState<TransactionFormPayload | null>(null);
  const [showNew, setShowNew] = useState(true);

  return (
    <div className="space-y-4">
      <div className="space-y-0">
        {showNew ? (
          <TransactionForm
            categories={DEMO_CATEGORIES}
            month="2026-06"
            categoriesById={DEMO_CATEGORIES_BY_ID}
            isFirst
            isLast
            onSubmit={(p) => { setSubmitted(p); setShowNew(false); }}
            onDelete={() => setShowNew(false)}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-center dark:border-zinc-700">
            <button onClick={() => { setShowNew(true); setSubmitted(null); }} className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
              + Show form again
            </button>
          </div>
        )}
      </div>
      {submitted && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Submitted: <code>{JSON.stringify(submitted)}</code></p>
      )}
    </div>
  );
}

function TransactionRowDemo() {
  return (
    <div className="space-y-0">
      <TransactionRow
        tx={DEMO_TRANSACTIONS[2]}
        categories={DEMO_CATEGORIES}
        month="2026-06"
        categoriesById={DEMO_CATEGORIES_BY_ID}
        isFirst
        isLast
        onSubmit={(p) => console.log("updated", p)}
        onDelete={() => console.log("deleted")}
      />
    </div>
  );
}

function GroupRowDemo() {
  const groceries = DEMO_TRANSACTIONS.filter((t) => t.category_id === 3);
  const total = groceries.reduce((s, t) => s + t.amount, 0);
  return (
    <div className="space-y-0">
      <GroupRow
        categoryId={3}
        total={total}
        rows={groceries}
        categories={DEMO_CATEGORIES}
        categoriesById={DEMO_CATEGORIES_BY_ID}
        month="2026-06"
        activeRecurringIds={new Set()}
        isFirst
        isLast
        onSubmit={(p) => console.log("submit", p)}
        onDelete={(id) => console.log("delete", id)}
      />
    </div>
  );
}

function EmailTransactionRowDemo() {
  const [discarded, setDiscarded] = useState(false);
  const [saved, setSaved] = useState<TransactionFormPayload | null>(null);

  if (discarded) return (
    <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-center dark:border-zinc-700">
      <button onClick={() => setDiscarded(false)} className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
        + Show again
      </button>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="space-y-0">
        <EmailTransactionRow
          emailTx={{
            id: "msg-demo-1",
            merchant: "Whole Foods",
            amount: 85,
            transacted_at: "2026-06-01T14:30:00Z",
            household_id: "hh-demo",
            received_at: "2026-06-01T14:31:00Z",
            from: "no-reply@chase.com",
            gmail_message_id: "msg-demo-1",
            deleted_at: null,
          }}
          categories={DEMO_CATEGORIES}
          categoriesById={DEMO_CATEGORIES_BY_ID}
          isFirst
          isLast
          onSave={(p) => setSaved(p)}
          onDiscard={() => setDiscarded(true)}
        />
      </div>
      {saved && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Saved: <code>{JSON.stringify(saved)}</code></p>
      )}
    </div>
  );
}

const GROUPS = [
  {
    label: "Primitives",
    items: ["Button", "ButtonLink", "CurrencyFlow", "ExpandableRow"],
  },
  {
    label: "Domain",
    items: ["MonthCard", "TransactionForm", "TransactionRow", "GroupRow", "EmailTransactionRow"],
  },
] as const;


function slugify(title: string) {
  return title.replace(/\s+/g, "-").toLowerCase();
}

function Sidebar() {
  const [active, setActive] = useState<string>(GROUPS[0].items[0]);

  const handleClick = (title: string) => {
    document.getElementById(slugify(title))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="hidden xl:flex sticky top-8 self-start w-44 shrink-0 flex-col gap-4">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((title) => (
              <li key={title}>
                <button
                  type="button"
                  onClick={() => { handleClick(title); setActive(title); }}
                  className={`w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${active === title ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"}`}
                >
                  {title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section id={slugify(title)} className="scroll-mt-8 space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}

function propCountsAfterSeparators(rows: { prop: string }[]) {
  const counts = new Map<number, number>();
  let separatorIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].prop.startsWith("—")) {
      separatorIdx = i;
      counts.set(i, 0);
    } else if (separatorIdx >= 0) {
      counts.set(separatorIdx, (counts.get(separatorIdx) ?? 0) + 1);
    }
  }
  return counts;
}

function PropTable({ rows }: { rows: { prop: string; type: string; default?: string; description: string }[] }) {
  const [open, setOpen] = useState(false);
  const sectionCounts = propCountsAfterSeparators(rows);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13" height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-90" : ""}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {open ? "Hide" : "Show"} props ({rows.filter((r) => !r.prop.startsWith("—")).length})
      </button>
      {open && (
        <div className="mt-2 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                <th className="px-3 py-2">Prop</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Default</th>
                <th className="px-3 py-2">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((r, i) => r.prop.startsWith("—") ? (
                <tr key={r.prop} className="bg-zinc-50 dark:bg-zinc-800/60">
                  <td colSpan={4} className="px-3 py-1.5 text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                    {r.prop.replace(/^— | —$/g, "")}
                    {sectionCounts.has(i) && (
                      <span className="ml-1.5 font-normal text-zinc-400 dark:text-zinc-500">({sectionCounts.get(i)})</span>
                    )}
                  </td>
                </tr>
              ) : (
                <tr key={r.prop} className="text-zinc-700 dark:text-zinc-300">
                  <td className="px-3 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100">{r.prop}</td>
                  <td className="px-3 py-2 font-mono text-xs text-violet-600 dark:text-violet-400">{r.type}</td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-400 dark:text-zinc-500">{r.default ?? "—"}</td>
                  <td className="px-3 py-2">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-90" : ""}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {open ? "Hide" : "View"} source
      </button>
      {open && (
        <div className="relative mt-2 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-950 dark:border-zinc-700">
          <button
            type="button"
            onClick={copy}
            className="absolute top-2 right-2 rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-zinc-200">
            <code>{code.trim()}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Source snippets ──────────────────────────────────────────────────────────

const BUTTON_SOURCE = `
{/* outlined */}
<Button variant="outlined">Add income</Button>
<Button variant="outlined" color="danger">Clear month</Button>

{/* filled */}
<Button variant="filled">Save</Button>
<Button variant="filled" disabled>Save</Button>
<Button variant="filled" color="danger">Delete</Button>

{/* ghost — text */}
<Button variant="ghost">Cancel</Button>
<Button variant="ghost" color="danger">Remove</Button>

{/* ghost — icon-only (square) */}
<Button variant="ghost" size="icon">
  <CalendarIcon />
</Button>
`;

const BUTTON_LINK_SOURCE = `
<ButtonLink to="/month/$month" params={{ month: "2026-06" }} variant="outlined">
  Jun 2026
</ButtonLink>

<ButtonLink to="/" variant="ghost" size="icon">
  <HomeIcon />
</ButtonLink>
`;

const CURRENCY_FLOW_SOURCE = `
<CurrencyFlow value={4250} className="text-xl font-semibold text-green-600 dark:text-green-400" />
`;

const EXPANDABLE_ROW_SOURCE = `
<div className="space-y-0">
  <ExpandableRow
    isFirst
    isLast
    summary={<span className="font-medium">Click to expand</span>}
  >
    <div className="px-4 pb-4 pt-2 text-sm text-zinc-600">
      Expanded content.
    </div>
  </ExpandableRow>
</div>
`;

const MONTH_CARD_SOURCE = `
<MonthCard month="2026-06" income={5000} expenses={3200} balance={1800} isCurrent nonInteractive />
`;

const TRANSACTION_FORM_SOURCE = `
{/* New transaction — renders a plain form with border */}
<TransactionForm
  categories={categories}
  month="2026-06"
  categoriesById={categoriesById}
  isFirst
  isLast
  onSubmit={(payload) => console.log(payload)}
  onDelete={() => {/* hide the form */}}
/>

{/* Edit mode — renders just the form fields + dialogs, no ExpandableRow.
    Wrap in TransactionRow if you need the expandable row layout. */}
<TransactionForm
  tx={existingTx}
  categories={categories}
  month="2026-06"
  categoriesById={categoriesById}
  onSubmit={(payload) => console.log(payload)}
  onDelete={() => console.log("delete", existingTx.public_id)}
  onClose={close}
/>
`;

const TRANSACTION_ROW_SOURCE = `
{/* ExpandableRow + TransactionForm edit mode */}
<div className="space-y-0">
  <TransactionRow
    tx={existingTx}
    categories={categories}
    month="2026-06"
    categoriesById={categoriesById}
    isFirst
    isLast
    onSubmit={(payload) => console.log(payload)}
    onDelete={() => console.log("deleted")}
  />
</div>
`;

const GROUP_ROW_SOURCE = `
{/* Wrap in a div; pass isFirst/isLast for border radius */}
<div>
  <GroupRow
    categoryId={3}
    total={-127}
    rows={groceryTransactions}
    categories={categories}
    categoriesById={categoriesById}
    month="2026-06"
    activeRecurringIds={new Set()}
    isFirst
    isLast
    onSubmit={(payload) => console.log(payload)}
    onDelete={(publicId) => console.log("delete", publicId)}
  />
</div>
`;

const EMAIL_TRANSACTION_ROW_SOURCE = `
<div>
  <EmailTransactionRow
    emailTx={{
      id: "msg-123",
      merchant: "Whole Foods",
      amount: 85,
      transacted_at: "2026-06-01T14:30:00Z",
      household_id: "hh-1",
      received_at: "2026-06-01T14:31:00Z",
      from: "no-reply@chase.com",
      gmail_message_id: "msg-123",
      deleted_at: null,
    }}
    categories={categories}
    categoriesById={categoriesById}
    isFirst
    isLast
    onSave={(payload) => console.log("save", payload)}
    onDiscard={() => console.log("discarded")}
  />
</div>
`;


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComponentShowcase() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Component Showcase</h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">Live instances of every reusable component in <code className="text-xs">src/components/</code>.</p>
      </div>
      <div className="flex gap-12">
      <Sidebar />
      <div className="min-w-0 flex-1 space-y-12">
      {/* ── Button ───────────────────────────────────────────────────────── */}
      <Section title="Button">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Three variants — <code className="text-xs">outlined</code>, <code className="text-xs">filled</code>, <code className="text-xs">ghost</code> — each with a <code className="text-xs">default</code> and <code className="text-xs">danger</code> color. Use <code className="text-xs">size="icon"</code> for icon-only buttons to get symmetric padding and a square aspect ratio.
        </p>
        <PropTable rows={[
          { prop: "variant", type: '"outlined" | "filled" | "ghost"', default: '"ghost"', description: "Visual style." },
          { prop: "color", type: '"default" | "danger"', default: '"default"', description: "Color intent." },
          { prop: "size", type: '"default" | "icon"', default: '"default"', description: 'Compact applies symmetric padding and aspect-square — use for icon-only buttons.' },
          { prop: "className", type: "string", default: "—", description: "Extra classes." },
          { prop: "...button", type: "ButtonHTMLAttributes", default: "—", description: "All native button props (onClick, disabled, type, etc.)." },
        ]} />

        <div className="space-y-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          {/* outlined */}
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-zinc-400 dark:text-zinc-500 uppercase">outlined</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outlined">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                Add income
              </Button>
              <Button variant="outlined">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                Add expense
              </Button>
              <Button variant="outlined">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                Add recurring
              </Button>
              <Button variant="outlined" color="danger">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                Clear month
              </Button>
            </div>
          </div>

          {/* filled */}
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-zinc-400 dark:text-zinc-500 uppercase">filled</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="filled">Save</Button>
              <Button variant="filled" disabled>Save</Button>
              <Button variant="filled" color="danger">Delete</Button>
            </div>
          </div>

          {/* ghost — text */}
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-zinc-400 dark:text-zinc-500 uppercase">ghost — text</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost">Cancel</Button>
              <Button variant="ghost" color="danger">Remove</Button>
            </div>
          </div>

          {/* ghost — icon */}
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-zinc-400 dark:text-zinc-500 uppercase">ghost — icon</p>
            <div className="flex flex-wrap items-center gap-1">
              <Button variant="ghost" size="icon" title="Previous">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </Button>
              <Button variant="ghost" size="icon" title="Next">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Button>
              <Button variant="ghost" size="icon" title="Calendar">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </Button>
              <Button variant="ghost" size="icon" title="Inbox">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
              </Button>
              <Button variant="ghost" size="icon" title="Sync">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              </Button>
              <Button variant="ghost" size="icon" title="Settings">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </Button>
            </div>
          </div>
        </div>
        <CodeBlock code={BUTTON_SOURCE} />
      </Section>

      {/* ── ButtonLink ───────────────────────────────────────────────────── */}
      <Section title="ButtonLink">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Same variants as <code className="text-xs">Button</code> but renders a TanStack Router <code className="text-xs">Link</code>. Accepts all <code className="text-xs">LinkProps</code> (<code className="text-xs">to</code>, <code className="text-xs">params</code>, <code className="text-xs">search</code>, …) plus native anchor handlers like <code className="text-xs">onClick</code>.
        </p>
        <PropTable rows={[
          { prop: "to", type: "string", description: "Route path (TanStack Router)." },
          { prop: "params", type: "object", default: "—", description: "Route params." },
          { prop: "variant", type: '"outlined" | "filled" | "ghost"', default: '"ghost"', description: "Visual style." },
          { prop: "color", type: '"default" | "danger"', default: '"default"', description: "Color intent." },
          { prop: "size", type: '"default" | "icon"', default: '"default"', description: "Compact for icon-only links." },
        ]} />
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <ButtonLink to="/showcase" variant="outlined">Showcase</ButtonLink>
          <ButtonLink to="/" variant="ghost">Home</ButtonLink>
          <ButtonLink to="/showcase" variant="ghost" size="icon" title="Showcase">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </ButtonLink>
        </div>
        <CodeBlock code={BUTTON_LINK_SOURCE} />
      </Section>

      {/* ── CurrencyFlow ─────────────────────────────────────────────────── */}
      <Section title="CurrencyFlow">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Animated currency display backed by <code className="text-xs">@number-flow/react</code>. Formats a number as USD with no decimal places.
        </p>
        <PropTable rows={[
          { prop: "value", type: "number", description: "The dollar amount to display." },
          { prop: "className", type: "string", default: "—", description: "Extra CSS classes passed to the NumberFlow element." },
        ]} />
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <CurrencyFlow value={4250} className="text-xl font-semibold text-green-600 dark:text-green-400" />
        </div>
        <CodeBlock code={CURRENCY_FLOW_SOURCE} />
      </Section>

      {/* ── ExpandableRow ─────────────────────────────────────────────────── */}
      <Section title="ExpandableRow">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Collapsible row with smooth CSS height animation. Used as the building block for <code className="text-xs">GroupRow</code> and <code className="text-xs">TransactionForm</code> (edit mode).
        </p>
        <PropTable rows={[
          { prop: "summary", type: "ReactNode", description: "Content shown in the collapsed header." },
          { prop: "children", type: "ReactNode | ((close: () => void) => ReactNode)", description: "Expanded content. Pass a function to receive a close() callback." },
          { prop: "isFirst", type: "boolean", default: "false", description: "Applies top rounded corners." },
          { prop: "isLast", type: "boolean", default: "false", description: "Applies bottom rounded corners." },
          { prop: "defaultExpanded", type: "boolean", default: "false", description: "Start in the open state." },
          { prop: "nested", type: "boolean", default: "false", description: "Alternate styling for rows nested inside another expandable." },
          { prop: "dimSummaryWhenOpen", type: "boolean", default: "false", description: "Fades the summary header when expanded." },
          { prop: "readOnly", type: "boolean", default: "false", description: "Disables expansion; renders a plain div instead of a button." },
        ]} />
        <div className="space-y-0">
          <ExpandableRow
            isFirst
            isLast
            summary={<span className="font-medium">Click to expand</span>}
          >
            <div className="px-4 pb-4 pt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Expanded content.
            </div>
          </ExpandableRow>
        </div>
        <CodeBlock code={EXPANDABLE_ROW_SOURCE} />
      </Section>

      {/* ── MonthCard ─────────────────────────────────────────────────────── */}
      <Section title="MonthCard">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Summary card for a calendar month. Shows income, expenses, and balance with an animated wave fill proportional to the savings rate. Links to <code className="text-xs">/month/$month</code> unless <code className="text-xs">nonInteractive</code>.
        </p>
        <PropTable rows={[
          { prop: "month", type: "string", description: 'Month in "YYYY-MM" format.' },
          { prop: "income", type: "number", description: "Total income for the month." },
          { prop: "expenses", type: "number", description: "Total expenses for the month." },
          { prop: "balance", type: "number", description: "Income minus expenses." },
          { prop: "isCurrent", type: "boolean", default: "false", description: 'Shows a "current" badge.' },
          { prop: "isPast", type: "boolean", default: "false", description: "Muted styling for past months." },
          { prop: "isLoading", type: "boolean", default: "false", description: "Pulse animation; hides the wave." },
          { prop: "nonInteractive", type: "boolean", default: "false", description: "Renders a div instead of a Link — no navigation." },
        ]} />
        <MonthCard month="2026-06" income={5000} expenses={3200} balance={1800} isCurrent nonInteractive />
        <CodeBlock code={MONTH_CARD_SOURCE} />
      </Section>

      {/* ── TransactionForm ──────────────────────────────────────────────── */}
      <Section title="TransactionForm">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Stateful form. Owns field state, validation, and delete/save-confirm dialogs. Without <code className="text-xs">tx</code> renders a "new" form; with <code className="text-xs">tx</code> renders edit mode (used inside <code className="text-xs">TransactionRow</code>). <code className="text-xs">TransactionForm.Fields</code> is the pure controlled UI layer — exposed as a subcomponent from the same file for cases where you need to own the state yourself (e.g. <code className="text-xs">Layout</code>'s demo form).
        </p>
        <PropTable rows={[
          { prop: "— TransactionForm —", type: "", description: "" },
          { prop: "tx", type: "Transaction", default: "—", description: "Existing transaction to edit. Omit to render a new-entry form." },
          { prop: "categories", type: "Category[]", description: "Available categories." },
          { prop: "month", type: "string", description: 'Current month in "YYYY-MM" format.' },
          { prop: "categoriesById", type: "Record<number, Category>", description: "Used in the delete/save dialogs." },
          { prop: "prefillCategoryId / Type / Amount / Description / Date", type: "various", default: "—", description: "Pre-fill fields on a new form." },
          { prop: "initialType", type: '"income" | "expense"', default: "—", description: "Initial type when no prefillCategoryType is set." },
          { prop: "publicId", type: "string", default: "—", description: "Force a specific public_id on the payload." },
          { prop: "focusOnMount", type: "boolean", default: "false", description: "Auto-focus the amount input." },
          { prop: "isRecurringPrefill", type: "boolean", default: "false", description: "Lock type+category; show Recurring badge." },
          { prop: "initiallyDirty", type: "boolean", default: "false", description: "Enable Save without changes (used for email prefills)." },
          { prop: "isRecurringCategory", type: "boolean", default: "false", description: "Same as isRecurringPrefill but driven by the selected category." },
          { prop: "dateDisabled", type: "boolean", default: "false", description: "Lock the date picker." },
          { prop: "isFirst / isLast", type: "boolean", default: "false", description: "Border-radius on the new-form wrapper." },
          { prop: "bare", type: "boolean", default: "false", description: "Skip the border wrapper (used by EmailTransactionRow)." },
          { prop: "confirmOnSave", type: "boolean", default: "false", description: "Show a confirmation dialog before saving an edit." },
          { prop: "cancelLabel", type: "string", default: '"Cancel"', description: "Label for the cancel button." },
          { prop: "onSubmit", type: "(payload: TransactionFormPayload) => void", default: "—", description: "Called with the final payload on save." },
          { prop: "onSaved", type: "() => void", default: "—", description: "Called after a new transaction is saved." },
          { prop: "onDelete", type: "() => void", default: "—", description: "Called after delete is confirmed." },
          { prop: "onClose", type: "() => void", default: "—", description: "Called on cancel in edit mode — lets TransactionRow close the ExpandableRow." },
          { prop: "hideMonthInDeleteDialog", type: "boolean", default: "false", description: "Hide the month link in the delete dialog." },
          { prop: "— TransactionForm.Fields —", type: "", description: "" },
          { prop: "form", type: "TransactionFieldsState", description: "Controlled state: date, amount, category_id, type, description." },
          { prop: "onPatch", type: "(p: Partial<TransactionFieldsState>) => void", description: "Partial updater." },
          { prop: "categories", type: "Category[]", description: "Filtered internally by the current type." },
          { prop: "categoryInputValue", type: "string", description: "Controlled value of the category text input." },
          { prop: "onCategoryInputChange", type: "(val: string) => void", description: "Called when the category input changes." },
          { prop: "canSave", type: "boolean", description: "Enables/disables the submit button." },
          { prop: "isEditing", type: "boolean", default: "false", description: 'Shows "Save" instead of "Add".' },
          { prop: "focusOnMount", type: "boolean", default: "false", description: "Auto-focuses the amount input." },
          { prop: "showDelete", type: "boolean", default: "false", description: "Shows the trash button." },
          { prop: "onDelete / onCancel", type: "() => void", description: "Delete and cancel callbacks." },
          { prop: "cancelLabel", type: "string", default: '"Cancel"', description: "Label for the cancel button." },
          { prop: "dateDisabled / isRecurringPrefill / isRecurringCategory", type: "boolean", default: "false", description: "Lock date, type+category respectively." },
        ]} />
        <TransactionFormDemo />
        <CodeBlock code={TRANSACTION_FORM_SOURCE} />
      </Section>

      {/* ── TransactionRow ───────────────────────────────────────────────── */}
      <Section title="TransactionRow">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Layout component: <code className="text-xs">ExpandableRow</code> with a standard transaction summary (category, description, amount) and a <code className="text-xs">TransactionForm</code> in edit mode inside. Use this anywhere you need an existing transaction rendered as an expandable row.
        </p>
        <PropTable rows={[
          { prop: "tx", type: "Transaction", description: "The transaction to display and edit." },
          { prop: "categories", type: "Category[]", description: "Passed through to TransactionForm." },
          { prop: "month", type: "string", description: 'Current month in "YYYY-MM" format.' },
          { prop: "categoriesById", type: "Record<number, Category>", description: "Used for the summary label and passed to TransactionForm." },
          { prop: "isFirst / isLast", type: "boolean", default: "false", description: "Border-radius on the ExpandableRow." },
          { prop: "nested", type: "boolean", default: "false", description: "Nested ExpandableRow styling (used inside GroupRow)." },
          { prop: "childCount", type: "number", default: "—", description: "Show 'N entries' in the summary (non-nested only)." },
          { prop: "isRecurringCategory", type: "boolean", default: "false", description: "Passed to TransactionForm to lock type+category." },
          { prop: "confirmOnSave", type: "boolean", default: "false", description: "Passed to TransactionForm." },
          { prop: "cancelLabel", type: "string", default: "—", description: "Passed to TransactionForm." },
          { prop: "hideMonthInDeleteDialog", type: "boolean", default: "false", description: "Passed to TransactionForm." },
          { prop: "onSubmit", type: "(payload: TransactionFormPayload) => void", default: "—", description: "Called on save." },
          { prop: "onDelete", type: "() => void", default: "—", description: "Called after delete confirmed." },
        ]} />
        <TransactionRowDemo />
        <CodeBlock code={TRANSACTION_ROW_SOURCE} />
      </Section>

      {/* ── GroupRow ─────────────────────────────────────────────────────── */}
      <Section title="GroupRow">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          An <code className="text-xs">ExpandableRow</code> that groups multiple transactions under a single category header. Expanded view renders a <code className="text-xs">TransactionRow</code> per transaction in nested mode.
        </p>
        <PropTable rows={[
          { prop: "categoryId", type: "number | null", description: "Category for the group header. null shows 'Uncategorized'." },
          { prop: "total", type: "number", description: "Sum of all transaction amounts in the group." },
          { prop: "rows", type: "Transaction[]", description: "The individual transactions to render inside." },
          { prop: "categories", type: "Category[]", description: "Passed through to each TransactionRow." },
          { prop: "categoriesById", type: "Record<number, Category>", description: "Passed through to each TransactionRow." },
          { prop: "month", type: "string", description: 'Current month in "YYYY-MM" format.' },
          { prop: "activeRecurringIds", type: "Set<number>", description: "Category IDs that are recurring; locks those TransactionForms." },
          { prop: "isFirst / isLast", type: "boolean", default: "false", description: "Border-radius on the outer ExpandableRow." },
          { prop: "readOnly", type: "boolean", default: "false", description: "Disables expansion entirely." },
          { prop: "onSubmit", type: "(payload: TransactionFormPayload) => void", default: "—", description: "Forwarded to each TransactionRow." },
          { prop: "onDelete", type: "(publicId: string) => void", default: "—", description: "Called with the public_id of the deleted transaction." },
        ]} />
        <GroupRowDemo />
        <CodeBlock code={GROUP_ROW_SOURCE} />
      </Section>

      {/* ── EmailTransactionRow ──────────────────────────────────────────── */}
      <Section title="EmailTransactionRow">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          An <code className="text-xs">ExpandableRow</code> for a Gmail-parsed transaction from the inbox. Expanded view is a pre-filled <code className="text-xs">TransactionForm</code> (bare mode, date locked). Discard triggers a confirmation dialog before calling <code className="text-xs">onDiscard</code>.
        </p>
        <PropTable rows={[
          { prop: "emailTx", type: "EmailTransaction", description: "The parsed email transaction (merchant, amount, transacted_at, etc.)." },
          { prop: "categories", type: "Category[]", description: "Passed through to the inner TransactionForm." },
          { prop: "categoriesById", type: "Record<number, Category>", description: "Passed through to the inner TransactionForm." },
          { prop: "isFirst / isLast", type: "boolean", default: "false", description: "Border-radius on the outer ExpandableRow." },
          { prop: "prefillCategoryId", type: "number", default: "—", description: "Pre-select a category (e.g. from a merchant→category mapping)." },
          { prop: "onSave", type: "(payload: TransactionFormPayload) => void", description: "Called when the user confirms the transaction." },
          { prop: "onDiscard", type: "() => void", description: "Called after the user confirms the discard dialog." },
        ]} />
        <EmailTransactionRowDemo />
        <CodeBlock code={EMAIL_TRANSACTION_ROW_SOURCE} />
      </Section>
      </div>
      </div>
    </div>
  );
}
