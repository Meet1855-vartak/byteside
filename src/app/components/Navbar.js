'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
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

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-accent" onClick={() => setMenuOpen(false)}>
          Byteside
        </Link>

        {/* Desktop menu */}
        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-5 text-sm font-medium">
            <Link href="/" className="text-muted hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/p2p" className="text-muted hover:text-foreground transition-colors">
              P2P
            </Link>
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
            className="text-lg leading-none hover:opacity-70 transition-opacity"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {profile ? (
            <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-3">
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

        {/* Mobile hamburger button */}
        <button
          className="sm:hidden text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-border bg-surface px-6 py-5 flex flex-col gap-4 text-sm font-medium">
          <Link href="/" className="text-muted hover:text-foreground transition-colors" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link href="/p2p" className="text-muted hover:text-foreground transition-colors" onClick={() => setMenuOpen(false)}>
            P2P
          </Link>
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