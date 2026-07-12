'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (error) {
      setMessage('❌ ' + error.message)
    } else {
      router.push(`/verify?email=${encodeURIComponent(email)}`)
    }
  }

  return (
    <main className="bg-background text-foreground min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl mb-6 text-center">Sign Up</h1>
        <form onSubmit={handleSignup} className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <p className="text-xs text-muted mt-1">Minimum 6 characters</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
          {message && <p className="text-sm text-center text-muted">{message}</p>}
        </form>
        <p className="text-sm text-muted text-center mt-4">
          Already have an account? <a href="/login" className="text-accent font-semibold">Log in</a>
        </p>
      </div>
    </main>
  )
}