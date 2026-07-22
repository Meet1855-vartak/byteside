'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [user, setUser] = useState(null)
  const [openComments, setOpenComments] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [commentPosting, setCommentPosting] = useState({})
  const [connectionMap, setConnectionMap] = useState({})

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    await loadPosts()
    if (user) await loadConnections(user.id)
  }

  async function loadPosts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select('id, content, created_at, author_id, profiles(username), comments(id, content, created_at, profiles(username))')
      .order('created_at', { ascending: false })

    if (!error) {
      const sorted = data.map((p) => ({
        ...p,
        comments: (p.comments || []).sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
      }))
      setPosts(sorted)
    }
    setLoading(false)
  }

  async function loadConnections(userId) {
    const { data } = await supabase
      .from('connections')
      .select('id, requester_id, recipient_id, status')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)

    const map = {}
    ;(data || []).forEach((c) => {
      const otherId = c.requester_id === userId ? c.recipient_id : c.requester_id
      const direction = c.requester_id === userId ? 'outgoing' : 'incoming'
      map[otherId] = { status: c.status, direction }
    })
    setConnectionMap(map)
  }

  async function sendConnectRequest(recipientId) {
    if (!user) return
    const { error } = await supabase.from('connections').insert({
      requester_id: user.id,
      recipient_id: recipientId,
    })
    if (!error) loadConnections(user.id)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!newPost.trim()) return
    setPosting(true)

    const { error } = await supabase.from('posts').insert({
      content: newPost,
      author_id: user.id,
    })

    if (!error) {
      setNewPost('')
      loadPosts()
    }
    setPosting(false)
  }

  async function handleCommentSubmit(postId) {
    const content = commentDrafts[postId]
    if (!content?.trim() || commentPosting[postId]) return

    setCommentPosting({ ...commentPosting, [postId]: true })

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      author_id: user.id,
      content: content,
    })

    if (!error) {
      setCommentDrafts({ ...commentDrafts, [postId]: '' })
      loadPosts()
    }
    setCommentPosting({ ...commentPosting, [postId]: false })
  }

  function toggleComments(postId) {
    setOpenComments({ ...openComments, [postId]: !openComments[postId] })
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const seconds = Math.floor((new Date() - date) / 1000)

    if (seconds < 60) return 'JUST NOW'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}M AGO`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}H AGO`

    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  function ConnectButton({ authorId }) {
    if (!user || user.id === authorId) return null

    const conn = connectionMap[authorId]

    if (!conn) {
      return (
        <button
          onClick={() => sendConnectRequest(authorId)}
          className="text-xs font-semibold text-accent hover:opacity-70 transition-opacity"
        >
          + Connect
        </button>
      )
    }
    if (conn.status === 'pending' && conn.direction === 'outgoing') {
      return <span className="text-xs text-muted">Request sent</span>
    }
    if (conn.status === 'pending' && conn.direction === 'incoming') {
      return (
        <a href="/connections" className="text-xs font-semibold text-accent hover:opacity-70 transition-opacity">
          Respond to request
        </a>
      )
    }
    if (conn.status === 'accepted') {
      return <span className="text-xs text-green-600 font-medium">✓ Connected</span>
    }
    return null
  }

  return (
    <main className="bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">

        <div className="mb-10">
          <h1 className="font-serif text-3xl mb-1">Thoughts, unfiltered.</h1>
          <p className="text-sm text-muted">A quiet space to write and read, nothing more.</p>
        </div>

        {user ? (
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="bg-surface border border-border rounded-xl p-5">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full bg-transparent font-serif text-lg leading-relaxed placeholder:text-muted focus:outline-none resize-none"
              />
            </div>
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={posting || !newPost.trim()}
                className="px-5 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {posting ? 'Posting...' : 'Publish'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-4 rounded-xl border border-border bg-surface text-sm text-muted text-center">
            <a href="/login" className="text-accent font-semibold">Log in</a> to share your thoughts.
          </div>
        )}

        {loading ? (
          <p className="text-muted text-sm">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-muted text-sm">No posts yet. Be the first to share something.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <article key={post.id} className="bg-surface border border-border rounded-xl p-6">
                <p className="font-serif text-lg leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
                <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{post.profiles?.username}</span>
                    <span className="text-muted text-xs">·</span>
                    <span className="text-xs font-medium text-muted tracking-wide">{formatDate(post.created_at)}</span>
                  </div>
                  <ConnectButton authorId={post.author_id} />
                </div>

                <button
                  onClick={() => toggleComments(post.id)}
                  className="text-xs font-semibold text-accent mt-3 hover:opacity-70 transition-opacity"
                >
                  {post.comments.length === 0
                    ? 'Comment'
                    : `${post.comments.length} comment${post.comments.length > 1 ? 's' : ''}`}
                  {openComments[post.id] ? ' ↑' : ' ↓'}
                </button>

                {openComments[post.id] && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    {post.comments.map((c) => (
                      <div key={c.id} className="bg-background border border-border rounded-lg p-3">
                        <p className="text-sm leading-relaxed">{c.content}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                          <span className="font-semibold text-foreground">{c.profiles?.username}</span>
                          <span>·</span>
                          <span>{formatDate(c.created_at)}</span>
                        </div>
                      </div>
                    ))}

                    {user ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentDrafts[post.id] || ''}
                          onChange={(e) =>
                            setCommentDrafts({ ...commentDrafts, [post.id]: e.target.value })
                          }
                          placeholder="Write a comment..."
                          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                        />
                        <button
                          onClick={() => handleCommentSubmit(post.id)}
                          disabled={commentPosting[post.id]}
                          className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                        >
                          {commentPosting[post.id] ? '...' : 'Send'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted">
                        <a href="/login" className="text-accent font-semibold">Log in</a> to comment.
                      </p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}