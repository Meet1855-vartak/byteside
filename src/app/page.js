'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    loadUser()
    loadPosts()
  }, [])

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  async function loadPosts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select('id, content, created_at, profiles(username)')
      .order('created_at', { ascending: false })

    if (!error) setPosts(data)
    setLoading(false)
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

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const seconds = Math.floor((new Date() - date) / 1000)

    if (seconds < 60) return 'JUST NOW'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}M AGO`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}H AGO`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
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
                className="px-5 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
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
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <span className="text-sm font-semibold">{post.profiles?.username}</span>
                  <span className="text-muted text-xs">·</span>
                  <span className="text-xs font-medium text-muted tracking-wide">{formatDate(post.created_at)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}