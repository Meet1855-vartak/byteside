'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Send, User, MessageSquare } from 'lucide-react'

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [connections, setConnections] = useState([])
  const [summaries, setSummaries] = useState({})
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load user, connections, and conversation summaries
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUser(user)

      const { data: conns } = await supabase
        .from('connections')
        .select(`
          id,
          requester_id,
          recipient_id,
          requester:profiles!connections_requester_id_fkey(id, username),
          recipient:profiles!connections_recipient_id_fkey(id, username)
        `)
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'accepted')

      const friendProfiles = (conns || []).map(c =>
        c.requester_id === user.id ? c.recipient : c.requester
      )
      setConnections(friendProfiles)

      await loadSummaries(user.id, friendProfiles)
      setLoading(false)
    }
    init()
  }, [])

  async function loadSummaries(userId, friendProfiles) {
    const { data: allMsgs } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    const map = {}
    ;(allMsgs || []).forEach((m) => {
      const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id
      if (!map[otherId]) {
        map[otherId] = { lastMessage: m, unreadCount: 0 }
      }
      if (m.receiver_id === userId && !m.read) {
        map[otherId].unreadCount += 1
      }
    })
    setSummaries(map)

    // Auto-select the most recent conversation, or the first connection if none yet
    if (!activeChat && friendProfiles.length > 0) {
      const sorted = sortFriends(friendProfiles, map)
      setActiveChat(sorted[0])
    }
  }

  function sortFriends(friendList, summaryMap) {
    return [...friendList].sort((a, b) => {
      const aTime = summaryMap[a.id]?.lastMessage?.created_at
      const bTime = summaryMap[b.id]?.lastMessage?.created_at
      if (aTime && bTime) return new Date(bTime) - new Date(aTime)
      if (aTime) return -1
      if (bTime) return 1
      return 0
    })
  }

  // Load message history for the active chat, mark as read, set up realtime
  useEffect(() => {
    if (!currentUser || !activeChat) return

    async function fetchMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true })

      setMessages(data || [])
      scrollToBottom()

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', activeChat.id)
        .eq('receiver_id', currentUser.id)
        .eq('read', false)

      // Instantly clear the unread badge for this contact in our local summary
      setSummaries((prev) => ({
        ...prev,
        [activeChat.id]: { ...(prev[activeChat.id] || {}), unreadCount: 0 },
      }))
    }

    fetchMessages()

    const channel = supabase
      .channel(`messages-for-${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new
          const involvesMe = msg.sender_id === currentUser.id || msg.receiver_id === currentUser.id
          if (!involvesMe) return

          const otherId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id

          // If it's the open chat, append it live and mark it read immediately
          if (
            (msg.sender_id === currentUser.id && msg.receiver_id === activeChat.id) ||
            (msg.sender_id === activeChat.id && msg.receiver_id === currentUser.id)
          ) {
            setMessages((prev) => [...prev, msg])
            scrollToBottom()
            if (msg.sender_id === activeChat.id) {
              supabase.from('messages').update({ read: true }).eq('id', msg.id).then()
            }
          }

          // Update the summary (last message + unread count) for whoever this is with
          setSummaries((prev) => {
            const existing = prev[otherId] || { unreadCount: 0 }
            const isOpenChat = otherId === activeChat.id
            return {
              ...prev,
              [otherId]: {
                lastMessage: msg,
                unreadCount:
                  msg.receiver_id === currentUser.id && !isOpenChat
                    ? existing.unreadCount + 1
                    : existing.unreadCount,
              },
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, activeChat])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function handleSendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || !activeChat || !currentUser) return

    const messageText = newMessage
    setNewMessage('')

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: activeChat.id,
      content: messageText,
    })

    if (error) console.error('Failed to send message:', error)
  }

  function formatPreviewTime(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-muted">
        Loading conversations...
      </div>
    )
  }

  const sortedConnections = sortFriends(connections, summaries)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-foreground">Direct Messages</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface border border-border rounded-2xl h-[650px] overflow-hidden shadow-sm">

        {/* Conversation List */}
        <div className="border-r border-border p-4 overflow-y-auto flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider px-2 mb-2">
            Connections
          </span>
          {sortedConnections.length === 0 ? (
            <p className="text-xs text-muted p-2">No connected users yet.</p>
          ) : (
            sortedConnections.map((friend) => {
              const summary = summaries[friend.id]
              const preview = summary?.lastMessage
                ? (summary.lastMessage.sender_id === currentUser.id ? 'You: ' : '') + summary.lastMessage.content
                : 'No messages yet'

              return (
                <button
                  key={friend.id}
                  onClick={() => setActiveChat(friend)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    activeChat?.id === friend.id
                      ? 'bg-accent/15 text-accent font-semibold'
                      : 'hover:bg-muted/10 text-foreground'
                  }`}
                >
                  <div className="w-9 h-9 shrink-0 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs">
                    {friend.username ? friend.username[0].toUpperCase() : <User size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm truncate">{friend.username}</span>
                      {summary?.lastMessage && (
                        <span className="text-[10px] text-muted shrink-0">
                          {formatPreviewTime(summary.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${summary?.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted'}`}>
                      {preview}
                    </p>
                  </div>
                  {summary?.unreadCount > 0 && (
                    <span className="shrink-0 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {summary.unreadCount}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Message Feed */}
        <div className="md:col-span-2 flex flex-col h-full bg-background/50">
          {activeChat ? (
            <>
              <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs">
                    {activeChat.username ? activeChat.username[0].toUpperCase() : <User size={14} />}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{activeChat.username}</h3>
                </div>
                <span className="text-[11px] text-muted">Messages expire after 7 days</span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                {messages.length === 0 ? (
                  <p className="text-xs text-muted text-center my-auto">
                    No recent messages. Start a conversation with {activeChat.username}!
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[75%] ${
                          isMe ? 'self-end items-end' : 'self-start items-start'
                        }`}
                      >
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-accent text-accent-foreground rounded-br-none'
                              : 'bg-surface border border-border text-foreground rounded-bl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-muted mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-surface border-t border-border flex gap-2">
                <input
                  type="text"
                  placeholder={`Write a message to ${activeChat.username}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-accent text-accent-foreground hover:opacity-90 transition-opacity flex items-center justify-center"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">
              Select a connection to start messaging
            </div>
          )}
        </div>

      </div>
    </div>
  )
}