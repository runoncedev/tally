import { Menu } from "@base-ui/react/menu";
import type { User } from "@supabase/supabase-js";
import { HeadContent, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Button, ButtonLink } from "./Button";
import { useEffect, useState } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { emailTransactionsCollection } from "../lib/collections";
import type { Household } from "../lib/household";
import { HouseholdContext, createHousehold, fetchHousehold, joinHousehold } from "../lib/household";
import { supabase } from "../lib/supabase";
import { ExpandableRow } from "./ExpandableRow";
import { MonthCard } from "./MonthCard";
import { TransactionForm } from "./TransactionForm";
import type { TransactionFieldsState } from "./TransactionForm";

const DEMO_CATEGORIES = [
  { id: 1, name: "Salary", type: "income" as const, created_at: "", household_id: null, recurring: false, default_amount: null },
  { id: 2, name: "Rent", type: "expense" as const, created_at: "", household_id: null, recurring: false, default_amount: null },
  { id: 3, name: "Groceries", type: "expense" as const, created_at: "", household_id: null, recurring: false, default_amount: null },
  { id: 4, name: "Dining", type: "expense" as const, created_at: "", household_id: null, recurring: false, default_amount: null },
];

const DEMO_BASE = { income: 0, expenses: 0 };

const DEMO_CATEGORIES_BY_ID = Object.fromEntries(
  [
    { id: 1, name: "Salary", type: "income" as const, created_at: "", household_id: null, recurring: false, default_amount: null },
    { id: 2, name: "Rent", type: "expense" as const, created_at: "", household_id: null, recurring: false, default_amount: null },
    { id: 3, name: "Groceries", type: "expense" as const, created_at: "", household_id: null, recurring: false, default_amount: null },
    { id: 4, name: "Dining", type: "expense" as const, created_at: "", household_id: null, recurring: false, default_amount: null },
    { id: 5, name: "Health", type: "expense" as const, created_at: "", household_id: null, recurring: false, default_amount: null },
  ].map((c) => [c.id, c])
);

type DemoTx = { public_id: string; amount: number; category_id: number | null; description: string | null; date: string; household_id: null };

const EMPTY_FORM: TransactionFieldsState = {
  date: new Date().toISOString().slice(0, 10), amount: "", category_id: null, type: "expense", description: "",
};

function txToForm(tx: DemoTx): TransactionFieldsState {
  return {
    date: tx.date,
    amount: String(Math.abs(tx.amount)),
    category_id: tx.category_id,
    type: tx.amount >= 0 ? "income" : "expense",
    description: tx.description ?? "",
  };
}

function DemoTxRow({ tx, isFirst, isLast, onUpdate, onDelete }: {
  tx: DemoTx;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (tx: DemoTx) => void;
  onDelete: () => void;
}) {
  const [form, setForm] = useState<TransactionFieldsState>(() => txToForm(tx));
  const [categoryInputValue, setCategoryInputValue] = useState(
    DEMO_CATEGORIES_BY_ID[tx.category_id ?? -1]?.name ?? ""
  );
  const patch = (p: Partial<TransactionFieldsState>) => setForm((prev) => ({ ...prev, ...p }));
  const isIncome = tx.amount >= 0;
  const catName = DEMO_CATEGORIES_BY_ID[tx.category_id ?? -1]?.name ?? null;

  const summary = (
    <>
      <span className="shrink-0 text-[15px] font-medium text-zinc-600 dark:text-zinc-300">
        {catName}
        {tx.description && <span className={`${catName ? "ml-2 " : ""}text-zinc-400 dark:text-zinc-500`}>{tx.description}</span>}
      </span>
      <span className={`ml-auto shrink-0 text-[15px] font-semibold ${isIncome ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
        {isIncome ? "+" : "-"}${Math.abs(tx.amount).toLocaleString("en-US")}
      </span>
    </>
  );

  return (
    <ExpandableRow summary={summary} isFirst={isFirst} isLast={isLast} dimSummaryWhenOpen>
      {(close) => (
        <div>
          <form className="group/form flex flex-col gap-3 p-4" onSubmit={(e) => {
            e.preventDefault();
            const raw = parseInt(form.amount, 10);
            if (isNaN(raw) || raw === 0) return;
            const amount = form.type === "expense" ? -raw : raw;
            onUpdate({ ...tx, amount, category_id: form.category_id, description: form.description || null });
            close();
          }}>
            <TransactionForm.Fields
              form={form}
              onPatch={patch}
              categories={DEMO_CATEGORIES}
              categoryInputValue={categoryInputValue}
              onCategoryInputChange={setCategoryInputValue}
              canSave={form.amount !== ""}
              isEditing
              showDelete
              onDelete={onDelete}
              onCancel={close}
            />
          </form>
        </div>
      )}
    </ExpandableRow>
  );
}

function LoginScreen() {
  const isLocal = window.location.hostname === "localhost";

  const [demoTxs, setDemoTxs] = useState<DemoTx[]>([
    { public_id: "demo-1", amount: 6_000, category_id: 1, description: null, date: "2026-05-01", household_id: null },
    { public_id: "demo-2", amount: -1_500, category_id: 2, description: null, date: "2026-05-01", household_id: null },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<TransactionFieldsState>(EMPTY_FORM);
  const [categoryInputValue, setCategoryInputValue] = useState("");

  const patch = (p: Partial<TransactionFieldsState>) =>
    setForm((prev) => ({ ...prev, ...p }));

  const handleDemoAdd = () => {
    const raw = parseInt(form.amount, 10);
    if (isNaN(raw) || raw === 0) return;
    const amount = form.type === "expense" ? -raw : raw;
    const tx: DemoTx = {
      public_id: crypto.randomUUID(),
      amount,
      category_id: form.category_id,
      description: form.description || null,
      date: new Date().toISOString().slice(0, 10),
      household_id: null,
    };
    setDemoTxs((prev) => [...prev, tx]);
    setForm(EMPTY_FORM);
    setCategoryInputValue("");
    setShowAddForm(false);
  };

  const demoIncome = DEMO_BASE.income + demoTxs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const demoExpenses = DEMO_BASE.expenses + demoTxs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const demoBalance = demoIncome - demoExpenses;


  const signInGoogle = () => {
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        scopes: 'https://www.googleapis.com/auth/gmail.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };


  return (
    <div className="bg-white dark:bg-zinc-900">
      <nav className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold">Tally</span>
          <div className="flex items-center gap-10">
            {isLocal && (
              <Link to="/login" className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                Local sign in
              </Link>
            )}
            <button
              onClick={signInGoogle}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-50 dark:text-zinc-900"
            >
              Sign in with Google
            </button>
          </div>
          {/* {isLocal && (
            <form onSubmit={signInEmail} className="mt-6 mx-auto flex w-full max-w-sm flex-col gap-2">
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              <button type="submit" className="rounded-lg border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">Sign in (local)</button>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </form>
          )} */}
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 pt-12 pb-8">
        <h2 className="mb-8 text-center text-2xl font-bold text-balance text-zinc-900 dark:text-zinc-50">Overview your spendings, month by month</h2>
        <div className="pointer-events-none flex flex-col gap-3 select-none">
          <MonthCard month={new Date().toISOString().slice(0, 7)} income={demoIncome} expenses={demoExpenses} balance={demoBalance} isCurrent nonInteractive />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-8">
        {/* <h2 className="mb-6 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">Quickly track your movements</h2> */}
        <div className="mx-auto max-w-xl flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setForm({ ...EMPTY_FORM, type: "income" }); setCategoryInputValue(""); setShowAddForm(true); }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
            >
              <span className="text-green-500">↓</span> Add income
            </button>
            <button
              type="button"
              onClick={() => { setForm({ ...EMPTY_FORM, type: "expense" }); setCategoryInputValue(""); setShowAddForm(true); }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
            >
              <span className="text-red-400">↑</span> Add expense
            </button>
          </div>
          {showAddForm && (
            <div className="rounded-xl border border-zinc-300 dark:border-zinc-700">
              <form className="flex flex-col gap-3 p-4" onSubmit={(e) => { e.preventDefault(); handleDemoAdd(); }}>
                <TransactionForm.Fields
                  form={form}
                  onPatch={patch}
                  categories={DEMO_CATEGORIES}
                  categoryInputValue={categoryInputValue}
                  onCategoryInputChange={setCategoryInputValue}
                  canSave={form.amount !== ""}
                  onCancel={() => { setForm(EMPTY_FORM); setCategoryInputValue(""); setShowAddForm(false); }}
                />
              </form>
            </div>
          )}
        </div>
      </div>

      {demoTxs.length > 0 && (
        <div className="mx-auto max-w-5xl px-4 pb-16">
          <div className="mx-auto max-w-xl">
            {demoTxs.map((tx, i) => (
              <DemoTxRow
                key={tx.public_id}
                tx={tx}
                isFirst={i === 0}
                isLast={i === demoTxs.length - 1}
                onUpdate={(updated) => setDemoTxs((prev) => prev.map((t) => t.public_id === tx.public_id ? updated : t))}
                onDelete={() => setDemoTxs((prev) => prev.filter((t) => t.public_id !== tx.public_id))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HouseholdSetup({ onDone }: { onDone: (h: Household) => void }) {
  const [name, setName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [mode, setMode] = useState<"create" | "join">("create");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "create") {
        const h = await createHousehold(name.trim() || "My Household");
        onDone(h);
      } else {
        await joinHousehold(joinId.trim());
        const h = await fetchHousehold();
        if (!h) throw new Error("Household not found");
        onDone(h);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mx-auto max-w-sm">
        <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Set up your account
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          Create a new household or join an existing one.
        </p>
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMode("create")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${mode === "create" ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900" : "border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"}`}
          >
            Create new
          </button>
          <button
            onClick={() => setMode("join")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${mode === "join" ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900" : "border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"}`}
          >
            Join existing
          </button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "create" ? (
            <input
              type="text"
              placeholder="Household name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          ) : (
            <input
              type="text"
              placeholder="Household ID"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {loading ? "..." : mode === "create" ? "Create household" : "Join household"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function Layout() {
  const [user, setUser] = useState<User | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: inboxItems = [] } = useLiveQuery(
    (q) => q.from({ e: emailTransactionsCollection }),
    [],
  );
  const inboxCount = inboxItems.length;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN" && session?.provider_refresh_token) {
        supabase.from("user_oauth_tokens").upsert(
          { user_id: session.user.id, refresh_token: session.provider_refresh_token },
          { onConflict: "user_id" }
        );
      }
      if (event === "SIGNED_OUT") setHousehold(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user === null && !loading) return;
    fetchHousehold()
      .then(setHousehold)
      .catch((err) => console.error("fetchHousehold failed:", err))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return null;

  if (!user) {
    if (pathname === "/login") return <><HeadContent /><Outlet /></>;
    return <LoginScreen />;
  }

  const nav = (
    <nav className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold">
          Tally
        </Link>
        <div className="flex items-center gap-1 text-sm text-zinc-400 dark:text-zinc-500">
          <div className="relative">
            <ButtonLink
              to="/inbox"
              size="icon"
              title="Inbox"
              className={pathname === "/inbox" ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" : ""}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
            </ButtonLink>
            {inboxCount > 0 && (
              <span className="pointer-events-none absolute right-0.5 bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white">
                {inboxCount > 99 ? "99+" : inboxCount}
              </span>
            )}
          </div>
          <Button
            size="icon"
            title="Gmail watch"
            onClick={async () => {
              const { data: { session } } = await supabase.auth.getSession()
              const token = session?.provider_token
              if (!token) { console.error('no provider_token'); return }
              const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/watch', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ topicName: 'projects/tally-493920/topics/gmail', labelIds: ['INBOX'] }),
              })
              const data = await res.json()
              console.log('gmail watch:', data)
              if (data.historyId) {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                  await supabase
                    .from('user_oauth_tokens')
                    .update({ last_history_id: String(data.historyId) })
                    .eq('user_id', user.id)
                    .is('last_history_id', null)
                }
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </Button>
          <Menu.Root>
            <Menu.Trigger className="inline-flex aspect-square items-center justify-center rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner align="end" sideOffset={4} className="z-50">
                <Menu.Popup className="min-w-40 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg outline-none dark:border-zinc-800 dark:bg-zinc-900">
                  {user?.email && (
                    <p className="truncate px-3 py-2 text-xs text-zinc-400 dark:text-zinc-500">
                      {user.email}
                    </p>
                  )}
                  {household && (
                    <>
                      <Menu.Item
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100 data-highlighted:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:data-highlighted:bg-zinc-800"
                        onClick={() => navigate({ to: "/settings/categories" })}
                      >
                        Categories
                      </Menu.Item>
                      <Menu.Separator className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
                    </>
                  )}
                  <Menu.Item
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100 data-highlighted:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:data-highlighted:bg-zinc-800"
                    onClick={() => supabase.auth.signOut()}
                  >
                    Sign out
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>
    </nav>
  );

  if (!household) {
    return (
      <>
        <HeadContent />
        {nav}
        <HouseholdSetup onDone={setHousehold} />
      </>
    );
  }

  return (
    <HouseholdContext.Provider value={household}>
      <HeadContent />
      {nav}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </HouseholdContext.Provider>
  );
}
