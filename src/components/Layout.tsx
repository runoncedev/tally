import { useEffect, useState } from "react";
import { Outlet, Link, HeadContent, useNavigate } from "@tanstack/react-router";
import { Menu } from "@base-ui/react/menu";
import { supabase } from "../lib/supabase";
import { HouseholdContext, fetchHousehold, createHousehold, joinHousehold } from "../lib/household";
import type { User } from "@supabase/supabase-js";
import type { Household } from "../lib/household";

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isLocal = window.location.hostname === "localhost";

  const signInGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });

  const signInEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Invalid email or password");
  };

  return (
    <div className="bg-white dark:bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-8 text-center">
        <h1 className="mb-8 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Tally
        </h1>
        <button
          onClick={signInGoogle}
          className="rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Sign in with Google
        </button>
        {isLocal && (
          <form onSubmit={signInEmail} className="mt-6 mx-auto flex w-full max-w-sm flex-col gap-2">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Sign in (local)
            </button>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </form>
        )}
      </div>
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
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

  if (!user) return <LoginScreen />;

  const nav = (
    <nav className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold">
          Tally
        </Link>
        <div className="flex items-center text-sm text-zinc-400 dark:text-zinc-500">
          <Menu.Root>
            <Menu.Trigger className="rounded-lg p-2 transition-colors hover:bg-zinc-100 hover:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-400">
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
                  {household && (
                    <>
                      <Menu.Item
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100 data-highlighted:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:data-highlighted:bg-zinc-800"
                        onClick={() => navigate({ to: "/settings/categories" })}
                      >
                        Categories
                      </Menu.Item>
                      <Menu.Item
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100 data-highlighted:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:data-highlighted:bg-zinc-800"
                        onClick={() => navigate({ to: "/settings/recurring" })}
                      >
                        Recurring transactions
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
