'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Connections() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [connected, setConnected] = useState([])
  const router = useRouter()

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
    await loadAll(user.id)
    setLoading(false)
  }

  async function loadAll(userId) {
    const { data } = await supabase
      .from('connections')
      .select('id, status, requester_id, recipient_id, created_at, requester:requester_id(username), recipient:recipient_id(username)')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    const rows = data || []
    setIncoming(rows.filter((r) => r.status === 'pending' && r.recipient_id === userId))
    setOutgoing(rows.filter((r) => r.status === 'pending' && r.requester_id === userId))
    setConnected(rows.filter((r) => r.status === 'accepted'))
  }

  async function respond(connectionId, newStatus) {
    await supabase.from('connections').update({ status: newStatus }).eq('id', connectionId)
    loadAll(user.id)
  }

  async function cancelOrRemove(connectionId) {
    await supabase.from('connections').delete().eq('id', connectionId)
    loadAll(user.id)
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) return <main className="p-12 text-center text-muted">Loading...</main>

  return (
    <main className="bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-serif text-3xl mb-1">Connections</h1>
          <p className="text-sm text-muted">Requests, and people you're connected with.</p>
        </div>

        <div className="mb-10">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
            Requests to you {incoming.length > 0 && `(${incoming.length})`}
          </h2>
          {incoming.length === 0 ? (
            <p className="text-sm text-muted">No pending requests.</p>
          ) : (
            <div className="space-y-3">
              {incoming.map((r) => (
                <div key={r.id} className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm">{r.requester?.username}</span>
                    <span className="text-xs text-muted ml-2">wants to connect · {formatDate(r.created_at)}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => respond(r.id, 'accepted')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respond(r.id, 'declined')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-background border border-border text-muted hover:text-foreground transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-10">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Requests you sent</h2>
          {outgoing.length === 0 ? (
            <p className="text-sm text-muted">No pending outgoing requests.</p>
          ) : (
            <div className="space-y-3">
              {outgoing.map((r) => (
                <div key={r.id} className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm">{r.recipient?.username}</span>
                    <span className="text-xs text-muted ml-2">pending · {formatDate(r.created_at)}</span>
                  </div>
                  <button
                    onClick={() => cancelOrRemove(r.id)}
                    className="text-xs font-semibold text-muted hover:text-accent transition-colors shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Connected</h2>
          {connected.length === 0 ? (
            <p className="text-sm text-muted">No connections yet.</p>
          ) : (
            <div className="space-y-3">
              {connected.map((r) => {
                const other = r.requester_id === user.id ? r.recipient : r.requester
                return (
                  <div key={r.id} className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{other?.username}</span>
                      <span className="text-xs text-green-600 font-medium">✓ Connected</span>
                    </div>
                    <button
                      onClick={() => cancelOrRemove(r.id)}
                      className="text-xs font-semibold text-muted hover:text-red-500 transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}