'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Menu, X, Feather } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('username, is_admin')
          .eq('id', user.id)
          .single()
        setProfile(data)

        const { count: connCount } = await supabase
          .from('connections')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('status', 'pending')
        setPendingCount(connCount || 0)

        const { count: msgCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('read', false)
        setUnreadCount(msgCount || 0)
      } else {
        setProfile(null)
        setPendingCount(0)
        setUnreadCount(0)
      }
    }
    loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setProfile(null)
    setMenuOpen(false)
    window.location.href = '/'
  }

  if (!mounted) return null

  const totalBadge = pendingCount + unreadCount

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-4">

        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="text-xl font-bold text-accent shrink-0 flex items-center gap-2.5 group"
          onClick={() => setMenuOpen(false)}
        >
          <div className="p-1.5 rounded-xl bg-accent/10 border border-accent/20 group-hover:bg-accent/20 transition-colors">
            <Feather className="w-5 h-5 text-accent" />
          </div>
          <span className="tracking-tight">Byteside</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center gap-6 lg:gap-8">
          <div className="flex items-center gap-5 lg:gap-6 text-sm font-medium">
            <Link href="/" className="text-muted hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/p2p" className="text-muted hover:text-foreground transition-colors">
              P2P
            </Link>
            {profile && (
              <>
                <Link href="/connections" className="text-muted hover:text-foreground transition-colors relative">
                  Connections
                  {pendingCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </Link>

                <Link href="/messages" className="text-muted hover:text-foreground transition-colors relative">
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            <Link href="/contact" className="text-muted hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link href="/faq" className="text-muted hover:text-foreground transition-colors">
              FAQ
            </Link>
            {profile?.is_admin && (
              <Link href="/admin" className="text-accent hover:opacity-80 transition-opacity font-semibold">
                Admin
              </Link>
            )}
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-lg leading-none hover:opacity-70 transition-opacity shrink-0"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {profile ? (
            <div className="flex items-center gap-3 shrink-0">
              <span className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-xs font-semibold text-accent">
                {profile.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-muted hover:text-accent transition-colors text-xs font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/login" className="text-muted hover:text-foreground transition-colors text-sm font-medium">
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="sm:hidden text-foreground relative shrink-0"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
          {totalBadge > 0 && !menuOpen && (
            <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {totalBadge}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-border bg-surface px-6 py-5 flex flex-col gap-4 text-sm font-medium">
          <Link href="/" className="text-muted hover:text-foreground transition-colors" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link href="/p2p" className="text-muted hover:text-foreground transition-colors" onClick={() => setMenuOpen(false)}>
            P2P
          </Link>

          {profile && (
            <>
              <Link
                href="/connections"
                className="text-muted hover:text-foreground transition-colors flex items-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                Connections
                {pendingCount > 0 && (
                  <span className="bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </Link>

              <Link
                href="/messages"
                className="text-muted hover:text-foreground transition-colors flex items-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                Messages
                {unreadCount > 0 && (
                  <span className="bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </>
          )}
          <Link href="/contact" className="text-muted hover:text-foreground transition-colors" onClick={() => setMenuOpen(false)}>
            Contact
          </Link>
          <Link href="/faq" className="text-muted hover:text-foreground transition-colors" onClick={() => setMenuOpen(false)}>
            FAQ
          </Link>
          {profile?.is_admin && (
            <Link href="/admin" className="text-accent font-semibold" onClick={() => setMenuOpen(false)}>
              Admin
            </Link>
          )}

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-2 pt-3 border-t border-border text-left"
          >
            {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>

          {profile ? (
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-xs font-semibold text-accent">
                {profile.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-muted hover:text-accent transition-colors text-xs font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <Link
                href="/login"
                className="text-muted hover:text-foreground transition-colors text-sm font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}