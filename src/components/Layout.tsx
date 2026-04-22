import { useEffect, useState } from 'react'
import { Outlet, Link } from '@tanstack/react-router'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

function LoginScreen() {
  const signIn = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
  return (
    <div className="flex items-center justify-center bg-white dark:bg-zinc-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8 text-zinc-900 dark:text-zinc-50">Tally</h1>
        <button
          onClick={signIn}
          className="px-6 py-3 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}

export function Layout() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null

  if (!user) return <LoginScreen />

  return (
    <>
      <nav className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex justify-between items-center">
        <Link to="/" className="font-bold text-lg">Tally</Link>
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Link
            to="/settings/recurring"
            className="p-2 rounded-lg hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Recurring transactions"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          </Link>
          <button
            onClick={() => supabase.auth.signOut()}
            className="p-2 rounded-lg hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Sign out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </>
  )
}
