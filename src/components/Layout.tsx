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
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
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
    <div className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">
      <nav className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex justify-between items-center">
        <Link to="/" className="font-bold text-lg">Tally</Link>
        <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <button
            onClick={() => supabase.auth.signOut()}
            className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
