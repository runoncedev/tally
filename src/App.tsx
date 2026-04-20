import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'

function App() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })

  const signOut = () => supabase.auth.signOut()

  if (!user) {
    return (
      <div>
        <h1>Tally</h1>
        <button onClick={signIn}>Sign in with Google</button>
      </div>
    )
  }

  const testQuery = async () => {
    const { data, error } = await supabase.from('categories').select('*')
    console.log({ data, error })
  }

  return (
    <div>
      <p>Logged in as {user.email}</p>
      <button onClick={testQuery}>Test query</button>
      <button onClick={signOut}>Sign out</button>
    </div>
  )
}

export default App
