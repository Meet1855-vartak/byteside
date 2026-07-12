'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Admin() {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [requests, setRequests] = useState([])
  const router = useRouter()

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  async function checkAdminAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      router.push('/')
      return
    }

    setAuthorized(true)
    await Promise.all([loadUsers(), loadPosts(), loadRequests()])
    setLoading(false)
  }

  async function loadUsers() {
    const { data, error } = await supabase.rpc('get_all_profiles_admin')
    if (!error) setUsers(data)
  }

  async function loadPosts() {
    const { data } = await supabase
      .from('posts')
      .select('id, content, created_at, profiles(username)')
      .order('created_at', { ascending: false })
    setPosts(data || [])
  }

  async function loadRequests() {
    const { data } = await supabase
      .from('p2p_requests')
      .select('id, description, status, created_at, profiles(username), p2p_responses(id, link, profiles(username))')
      .order('created_at', { ascending: false })
    setRequests(data || [])
  }

  async function toggleBan(userId, currentStatus) {
    await supabase.from('profiles').update({ is_banned: !currentStatus }).eq('id', userId)
    loadUsers()
  }

  async function deletePost(postId) {
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', postId)
    loadPosts()
  }

  async function deleteRequest(requestId) {
    if (!confirm('Delete this request and all its responses?')) return
    await supabase.from('p2p_requests').delete().eq('id', requestId)
    loadRequests()
  }

  async function deleteResponse(responseId) {
    if (!confirm('Delete this response?')) return
    await supabase.from('p2p_responses').delete().eq('id', responseId)
    loadRequests()
  }

  if (loading) return <main className="p-12 text-center text-muted">Loading...</main>
  if (!authorized) return null

  return (
    <main className="bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-serif text-3xl mb-1">Admin Panel</h1>
          <p className="text-sm text-muted">Manage users, posts, and P2P activity.</p>
        </div>

        <div className="flex gap-2 mb-8 border-b border-border">
          {['users', 'posts', 'p2p'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 transition-colors ${
                tab === t ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{u.username}</span>
                    {u.is_admin && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">Admin</span>}
                    {u.is_banned && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">Banned</span>}
                  </div>
                  <p className="text-xs text-muted mt-1">{u.email}</p>
                </div>
                {!u.is_admin && (
                  <button
                    onClick={() => toggleBan(u.id, u.is_banned)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                      u.is_banned
                        ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                        : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                    }`}
                  >
                    {u.is_banned ? 'Unban' : 'Ban'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'posts' && (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-surface border border-border rounded-xl p-4">
                <p className="text-sm mb-2">{post.content}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">{post.profiles?.username}</span>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-xs font-semibold text-red-500 hover:opacity-70 transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'p2p' && (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm">{req.description}</p>
                  <button
                    onClick={() => deleteRequest(req.id)}
                    className="text-xs font-semibold text-red-500 hover:opacity-70 transition-opacity shrink-0"
                  >
                    Delete request
                  </button>
                </div>
                <p className="text-xs text-muted mt-2">{req.profiles?.username} · {req.status}</p>
                {req.p2p_responses?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {req.p2p_responses.map((res) => (
                      <div key={res.id} className="bg-background border border-border rounded-lg p-2 flex items-center justify-between gap-2">
                        <span className="text-xs break-all">{res.link}</span>
                        <button
                          onClick={() => deleteResponse(res.id)}
                          className="text-xs font-semibold text-red-500 hover:opacity-70 transition-opacity shrink-0"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}