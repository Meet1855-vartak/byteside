'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function P2P() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [newRequest, setNewRequest] = useState('')
  const [posting, setPosting] = useState(false)
  const [user, setUser] = useState(null)
  const [responseText, setResponseText] = useState({})
  const [respondingTo, setRespondingTo] = useState(null)

  useEffect(() => {
    loadUser()
    loadRequests()
  }, [])

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  async function loadRequests() {
    setLoading(true)
    const { data, error } = await supabase
      .from('p2p_requests')
      .select('id, description, status, created_at, requester_id, profiles(username), p2p_responses(id, link, created_at, profiles(username))')
      .order('created_at', { ascending: false })

    if (!error) setRequests(data)
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!newRequest.trim()) return
    setPosting(true)

    const { error } = await supabase.from('p2p_requests').insert({
      description: newRequest,
      requester_id: user.id,
    })

    if (!error) {
      setNewRequest('')
      loadRequests()
    }
    setPosting(false)
  }

  async function handleRespond(requestId) {
    const link = responseText[requestId]
    if (!link?.trim()) return

    const { error } = await supabase.from('p2p_responses').insert({
      request_id: requestId,
      responder_id: user.id,
      link: link,
    })

    if (!error) {
      setResponseText({ ...responseText, [requestId]: '' })
      setRespondingTo(null)
      loadRequests()
    }
  }

  async function handleReopen(requestId) {
    const { error } = await supabase
      .from('p2p_requests')
      .update({ status: 'open' })
      .eq('id', requestId)

    if (!error) loadRequests()
  }

  function linkType(url) {
    if (url.includes('wormhole.app')) return { label: 'Wormhole', icon: '🔗', expiring: true }
    if (url.includes('drive.google.com')) return { label: 'Drive', icon: '📁', expiring: false }
    return { label: 'Link', icon: '🔗', expiring: false }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const seconds = Math.floor((new Date() - date) / 1000)
    if (seconds < 60) return 'JUST NOW'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}M AGO`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}H AGO`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
  }

  return (
    <main className="bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-serif text-3xl mb-1">P2P Requests</h1>
          <p className="text-sm text-muted">Looking for a file? Ask here. Someone might have it.</p>
        </div>

        {user ? (
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="bg-surface border border-border rounded-xl p-5">
              <textarea
                value={newRequest}
                onChange={(e) => setNewRequest(e.target.value)}
                placeholder="What are you looking for?"
                rows={2}
                className="w-full bg-transparent text-base leading-relaxed placeholder:text-muted focus:outline-none resize-none"
              />
            </div>
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={posting || !newRequest.trim()}
                className="px-5 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {posting ? 'Requesting...' : 'Request'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-4 rounded-xl border border-border bg-surface text-sm text-muted text-center">
            <a href="/login" className="text-accent font-semibold">Log in</a> to post or respond to requests.
          </div>
        )}

        {loading ? (
          <p className="text-muted text-sm">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-muted text-sm">No requests yet.</p>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const isOwner = user?.id === req.requester_id
              const hasExpiringLink = req.p2p_responses?.some(r => linkType(r.link).expiring)

              return (
                <div key={req.id} className="bg-surface border border-border rounded-xl p-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base leading-relaxed">{req.description}</p>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                      req.status === 'open' ? 'bg-accent/10 text-accent' :
                      req.status === 'fulfilled' ? 'bg-green-500/10 text-green-600' :
                      'bg-muted/10 text-muted'
                    }`}>
                      {req.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border text-xs text-muted">
                    <span className="font-semibold text-foreground">{req.profiles?.username}</span>
                    <span>·</span>
                    <span>{formatDate(req.created_at)}</span>
                  </div>

                  {req.p2p_responses?.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {req.p2p_responses.map((res) => {
                        const type = linkType(res.link)
                        return (
                          <div key={res.id} className="bg-background border border-border rounded-lg p-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-xs">{type.icon}</span>
                              <a href={res.link} target="_blank" rel="noopener noreferrer" className="text-accent font-medium break-all">
                                {res.link}
                              </a>
                            </div>
                            <p className="text-xs text-muted mt-1">— {res.profiles?.username}</p>
                          </div>
                        )
                      })}
                      {hasExpiringLink && (
                        <p className="text-xs text-muted italic">
                          ⚠️ Wormhole links may expire — if this doesn't work, ask the requester to check again.
                        </p>
                      )}
                    </div>
                  )}

                  {isOwner && req.status === 'fulfilled' && (
                    <button
                      onClick={() => handleReopen(req.id)}
                      className="mt-3 text-xs font-semibold text-muted hover:text-accent transition-colors"
                    >
                      Link not working? Reopen request →
                    </button>
                  )}

                  {user && req.status === 'open' && (
                    <div className="mt-4">
                      {respondingTo === req.id ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs text-muted">
                            Share via{' '}
                            <a href="https://wormhole.app" target="_blank" rel="noopener noreferrer" className="text-accent font-medium underline">
                              Wormhole
                            </a>{' '}
                            or Google Drive — paste your link below
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={responseText[req.id] || ''}
                              onChange={(e) => setResponseText({ ...responseText, [req.id]: e.target.value })}
                              placeholder="Paste your link here"
                              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                            />
                            <button
                              onClick={() => handleRespond(req.id)}
                              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRespondingTo(req.id)}
                          className="text-accent text-sm font-semibold hover:opacity-70 transition-opacity"
                        >
                          Respond →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}