import { useEffect, useState } from "react";
import { Outlet, Link, HeadContent, useNavigate } from "@tanstack/react-router";
import { Menu } from "@base-ui/react/menu";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

function LoginScreen() {
  const signIn = () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  return (
    <div className="flex min-h-dvh items-center justify-center bg-white dark:bg-zinc-900">
      <div className="text-center">
        <h1 className="mb-8 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Tally
        </h1>
        <button
          onClick={signIn}
          className="rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export function Layout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  if (!user) return <LoginScreen />;

  return (
    <>
      <HeadContent />
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
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </>
  );
}
