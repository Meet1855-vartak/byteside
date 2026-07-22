'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Send, User, MessageSquare } from 'lucide-react'

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [connections, setConnections] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load User & Connected Friends
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

      if (conns) {
        const friendProfiles = conns.map(c => 
          c.requester_id === user.id ? c.recipient : c.requester
        )
        setConnections(friendProfiles)
        if (friendProfiles.length > 0) setActiveChat(friendProfiles[0])
      }
      setLoading(false)
    }
    init()
  }, [])

  // Load Message History & Set Up Realtime Listener
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
    }

    fetchMessages()

    const channel = supabase
      .channel(`chat:${currentUser.id}-${activeChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const msg = payload.new
          if (
            (msg.sender_id === currentUser.id && msg.receiver_id === activeChat.id) ||
            (msg.sender_id === activeChat.id && msg.receiver_id === currentUser.id)
          ) {
            setMessages((prev) => [...prev, msg])
            scrollToBottom()
          }
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
      content: messageText
    })

    if (error) console.error('Failed to send message:', error)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-muted">
        Loading conversations...
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-foreground">Direct Messages</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface border border-border rounded-2xl h-[650px] overflow-hidden shadow-sm">
        
        {/* Friends Sidebar */}
        <div className="border-r border-border p-4 overflow-y-auto flex flex-col gap-2">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider px-2 mb-2">
            Connections
          </span>
          {connections.length === 0 ? (
            <p className="text-xs text-muted p-2">No connected users yet.</p>
          ) : (
            connections.map((friend) => (
              <button
                key={friend.id}
                onClick={() => setActiveChat(friend)}
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                  activeChat?.id === friend.id
                    ? 'bg-accent/15 text-accent font-semibold'
                    : 'hover:bg-muted/10 text-foreground'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs">
                  {friend.username ? friend.username[0].toUpperCase() : <User size={14} />}
                </div>
                <span className="text-sm truncate">{friend.username}</span>
              </button>
            ))
          )}
        </div>

        {/* Message Feed */}
        <div className="md:col-span-2 flex flex-col h-full bg-background/50">
          {activeChat ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs">
                    {activeChat.username ? activeChat.username[0].toUpperCase() : <User size={14} />}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{activeChat.username}</h3>
                </div>
                <span className="text-[11px] text-muted">Messages expire after 7 days</span>
              </div>

              {/* Chat Container */}
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
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
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