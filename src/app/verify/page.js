'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function VerifyForm() {
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  async function handleVerify(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })

    setLoading(false)

    if (error) {
      setMessage('❌ ' + error.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-serif text-3xl mb-2 text-center">Check your email</h1>
      <p className="text-sm text-muted text-center mb-6">
        Enter the 6-digit code we sent to {email || 'your email'}
      </p>
      <form onSubmit={handleVerify} className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          maxLength={6}
          placeholder="123456"
          className="w-full text-center text-2xl tracking-[0.5em] bg-background border border-border rounded-lg px-3 py-3 focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {loading ? 'Verifying...' : 'Verify & Log In'}
        </button>
        {message && <p className="text-sm text-center text-muted">{message}</p>}
      </form>
    </div>
  )
}

export default function Verify() {
  return (
    <main className="bg-background text-foreground min-h-[70vh] flex items-center justify-center px-6">
      <Suspense fallback={<p className="text-muted text-sm">Loading...</p>}>
        <VerifyForm />
      </Suspense>
    </main>
  )
}