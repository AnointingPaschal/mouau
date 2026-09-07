'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import {
  Send, Loader2, Bot, RefreshCw, Sparkles, History,
  X, Copy, Edit2, RotateCcw, CheckCircle2, Trash2,
  Plus, ChevronRight, Clock, MessageCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ChatMessage {
  id: string; role: 'user' | 'assistant'; content: string; model?: string; timestamp: number
}
interface ChatSession {
  id: string; title: string; messages: ChatMessage[]; createdAt: number; updatedAt: number
}

const SUGGESTIONS = [
  'Where is COLNAS located?', 'What departments are in CEET?',
  'How do I pay my school fees?', 'Where is the Anyim Pius Auditorium?',
  'What is CNREM?', 'How do I register courses?',
]

function genId() { return Math.random().toString(36).slice(2, 10) }
function genSessionTitle(msgs: ChatMessage[]) {
  const first = msgs.find(m => m.role === 'user')
  if (!first) return 'New Chat'
  return first.content.length > 40 ? first.content.slice(0, 40) + '…' : first.content
}

// localStorage helpers
const STORAGE_KEY = (id: string) => `mouau_chat_sessions_${id}`
function loadSessions(studentId: string): ChatSession[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY(studentId)) || '[]') } catch { return [] }
}
function saveSessions(studentId: string, sessions: ChatSession[]) {
  try { localStorage.setItem(STORAGE_KEY(studentId), JSON.stringify(sessions.slice(0, 30))) } catch {}
}

export default function ChatPage() {
  const { student } = useAuth()
  const sid = student?.idNumber || 'guest'

  const [sessions, setSessions]   = useState<ChatSession[]>([])
  const [activeId, setActiveId]   = useState<string>('')
  const [messages, setMessages]   = useState<ChatMessage[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [copiedId, setCopiedId]   = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText]   = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  // Load sessions on mount
  useEffect(() => {
    const loaded = loadSessions(sid)
    setSessions(loaded)
    if (loaded.length > 0) {
      const last = loaded[0]
      setActiveId(last.id); setMessages(last.messages)
    } else { startNewSession() }
  }, [sid])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const startNewSession = useCallback(() => {
    const id = genId()
    const newSession: ChatSession = { id, title: 'New Chat', messages: [], createdAt: Date.now(), updatedAt: Date.now() }
    setSessions(prev => {
      const next = [newSession, ...prev]
      saveSessions(sid, next)
      return next
    })
    setActiveId(id); setMessages([]); setShowHistory(false)
  }, [sid])

  const persistSession = useCallback((id: string, msgs: ChatMessage[]) => {
    setSessions(prev => {
      const next = prev.map(s => s.id === id
        ? { ...s, messages: msgs, title: genSessionTitle(msgs), updatedAt: Date.now() }
        : s
      ).sort((a, b) => b.updatedAt - a.updatedAt)
      saveSessions(sid, next)
      return next
    })
  }, [sid])

  const loadSession = (session: ChatSession) => {
    setActiveId(session.id); setMessages(session.messages); setShowHistory(false)
  }

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      saveSessions(sid, next)
      return next
    })
    if (activeId === id) startNewSession()
  }

  const callAI = async (msgs: ChatMessage[]): Promise<{ content: string; model: string }> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgs.map(m => ({ role: m.role, content: m.content })) })
    })
    return res.json()
  }

  const send = async (text?: string) => {
    const q = (text || input).trim()
    if (!q || loading) return
    setInput('')

    const userMsg: ChatMessage = { id: genId(), role: 'user', content: q, timestamp: Date.now() }
    let sessionId = activeId
    if (!sessionId) { sessionId = genId(); setActiveId(sessionId) }

    const updated = [...messages, userMsg]
    setMessages(updated); setLoading(true)

    try {
      const data = await callAI(updated)
      const aiMsg: ChatMessage = { id: genId(), role: 'assistant', content: data.content, model: data.model, timestamp: Date.now() }
      const final = [...updated, aiMsg]
      setMessages(final); persistSession(sessionId, final)
    } catch {
      const errMsg: ChatMessage = { id: genId(), role: 'assistant', content: 'Connection error. Please try again.', timestamp: Date.now() }
      const final = [...updated, errMsg]
      setMessages(final); persistSession(sessionId, final)
    }
    setLoading(false); inputRef.current?.focus()
  }

  const copyMessage = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content).catch(() => {})
    setCopiedId(msg.id); setTimeout(() => setCopiedId(null), 2000)
  }

  const startEdit = (msg: ChatMessage) => { setEditingId(msg.id); setEditText(msg.content) }

  const submitEdit = async (msg: ChatMessage) => {
    if (!editText.trim() || loading) return
    // Remove this message and everything after it, then re-send
    const idx = messages.findIndex(m => m.id === msg.id)
    const trimmed = messages.slice(0, idx)
    setMessages(trimmed); setEditingId(null)
    setLoading(true)

    const userMsg: ChatMessage = { id: genId(), role: 'user', content: editText.trim(), timestamp: Date.now() }
    const updated = [...trimmed, userMsg]
    setMessages(updated)

    try {
      const data = await callAI(updated)
      const aiMsg: ChatMessage = { id: genId(), role: 'assistant', content: data.content, model: data.model, timestamp: Date.now() }
      const final = [...updated, aiMsg]
      setMessages(final); persistSession(activeId, final)
    } catch {
      const errMsg: ChatMessage = { id: genId(), role: 'assistant', content: 'Error. Please try again.', timestamp: Date.now() }
      const final = [...updated, errMsg]
      setMessages(final); persistSession(activeId, final)
    }
    setLoading(false)
  }

  const regenerate = async (msg: ChatMessage) => {
    if (loading || msg.role !== 'assistant') return
    const idx = messages.findIndex(m => m.id === msg.id)
    const context = messages.slice(0, idx)
    if (context.length === 0) return
    setMessages(context); setLoading(true)

    try {
      const data = await callAI(context)
      const aiMsg: ChatMessage = { id: genId(), role: 'assistant', content: data.content, model: data.model, timestamp: Date.now() }
      const final = [...context, aiMsg]
      setMessages(final); persistSession(activeId, final)
    } catch {
      setMessages(messages)
    }
    setLoading(false)
  }

  const av = (student?.name || 'ST').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <AppShell>
      <TopBar title="AI Assistant" subtitle="Ask anything about MOUAU"/>

      <div className="flex flex-col h-[calc(100vh-104px)] lg:h-[calc(100vh-60px)] relative">

        {/* Top action bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#e8e8e8] bg-white">
          <button onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7] transition-all">
            <History className="w-3.5 h-3.5"/> History
            {sessions.length > 0 && <span className="bg-[#1a6b3a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{sessions.length}</span>}
          </button>
          <div className="flex-1"/>
          <button onClick={startNewSession}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0a0a0a] text-white hover:bg-[#1a6b3a] transition-all">
            <Plus className="w-3.5 h-3.5"/> New Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-3 w-full">

          {messages.length === 0 && (
            <div className="animate-fade-in">
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-[#0a0a0a] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-[#1a6b3a]"/>
                </div>
                <h2 className="font-black text-[#0a0a0a] text-base">MOUAU AI Assistant</h2>
                <p className="text-[#6b6b6b] text-xs mt-1 max-w-xs mx-auto">Ask me anything about MOUAU — colleges, registration, campus locations, fees, or student life.</p>
              </div>
              <div className="section-label mb-3 justify-center">QUICK QUESTIONS</div>
              <div className="space-y-1.5">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="w-full text-left p-3 border border-[#e8e8e8] rounded-xl text-sm text-[#0a0a0a] hover:border-[#1a6b3a]/40 hover:bg-[#f9f9f7] transition-all font-medium flex items-center justify-between group">
                    <span>{s}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#ddd] group-hover:text-[#1a6b3a] transition-colors flex-shrink-0"/>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-[#0a0a0a] rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-[#1a6b3a]"/>
                </div>
              )}
              <div className="max-w-[85%] space-y-1">
                {editingId === msg.id ? (
                  <div className="space-y-2">
                    <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} autoFocus
                      className="w-full input resize-none text-sm"
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(msg) } }}/>
                    <div className="flex gap-2">
                      <button onClick={() => submitEdit(msg)} className="btn-primary text-xs px-3 py-1.5">Submit</button>
                      <button onClick={() => setEditingId(null)} className="btn-outline text-xs px-3 py-1.5">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'chat-user' : 'chat-ai'}`}>
                      {msg.content}
                    </div>
                    {/* Message actions */}
                    <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <button onClick={() => copyMessage(msg)} title="Copy"
                        className="p-1.5 rounded-lg bg-white border border-[#e8e8e8] text-[#aaa] hover:text-[#1a6b3a] hover:border-[#1a6b3a]/30 transition-all">
                        {copiedId === msg.id ? <CheckCircle2 className="w-3 h-3 text-[#1a6b3a]"/> : <Copy className="w-3 h-3"/>}
                      </button>
                      {msg.role === 'user' && (
                        <button onClick={() => startEdit(msg)} title="Edit"
                          className="p-1.5 rounded-lg bg-white border border-[#e8e8e8] text-[#aaa] hover:text-[#0a0a0a] hover:border-[#0a0a0a]/30 transition-all">
                          <Edit2 className="w-3 h-3"/>
                        </button>
                      )}
                      {msg.role === 'assistant' && i === messages.length - 1 && (
                        <button onClick={() => regenerate(msg)} title="Regenerate" disabled={loading}
                          className="p-1.5 rounded-lg bg-white border border-[#e8e8e8] text-[#aaa] hover:text-[#0a0a0a] hover:border-[#0a0a0a]/30 transition-all disabled:opacity-40">
                          <RotateCcw className="w-3 h-3"/>
                        </button>
                      )}
                      <span className="text-[9px] text-[#ddd] px-1">
                        {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 bg-[#1a6b3a] rounded-full flex items-center justify-center ml-2 mt-1 flex-shrink-0 text-white font-bold text-[10px]">
                  {av}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="w-7 h-7 bg-[#0a0a0a] rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-[#1a6b3a]"/>
              </div>
              <div className="chat-ai px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a6b3a]"/>
                <span className="text-sm text-[#aaa]">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div className="border-t border-[#e8e8e8] bg-white px-3 py-2.5 pb-3">
          <div className="flex items-end gap-2 w-full">
            {messages.length > 0 && (
              <button onClick={startNewSession}
                className="p-2 rounded-xl border border-[#e8e8e8] text-[#aaa] hover:text-[#0a0a0a] hover:border-[#0a0a0a] transition-all flex-shrink-0 mb-0.5">
                <RefreshCw className="w-3.5 h-3.5"/>
              </button>
            )}
            <div className="flex-1 border border-[#e8e8e8] rounded-xl px-3 py-2 focus-within:border-[#1a6b3a] transition-colors bg-white">
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} rows={1}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask about MOUAU..." style={{ resize: 'none', minHeight: '24px', maxHeight: '80px' }}
                className="w-full text-sm outline-none bg-transparent text-[#0a0a0a] placeholder-[#aaa] leading-relaxed"
                onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 80) + 'px' }}/>
            </div>
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="p-2 bg-[#1a6b3a] text-white rounded-xl hover:bg-[#145530] disabled:opacity-40 transition-all flex-shrink-0 mb-0.5">
              <Send className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>

        {/* History drawer */}
        {showHistory && (
          <div className="absolute inset-0 z-30 flex">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowHistory(false)}/>
            <div className="relative w-80 max-w-[90vw] bg-white h-full flex flex-col shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e8e8]">
                <div>
                  <p className="font-black text-[#0a0a0a] text-sm">Chat History</p>
                  <p className="text-[#aaa] text-[10px]">{sessions.length} saved conversations</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4 text-[#aaa]"/></button>
              </div>
              <button onClick={startNewSession}
                className="flex items-center gap-2.5 px-4 py-3 border-b border-[#e8e8e8] hover:bg-[#f9f9f7] transition-colors text-left w-full">
                <div className="w-8 h-8 border-2 border-dashed border-[#e8e8e8] rounded-xl flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 text-[#aaa]"/>
                </div>
                <p className="font-semibold text-sm text-[#0a0a0a]">New Conversation</p>
              </button>
              <div className="flex-1 overflow-y-auto">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <MessageCircle className="w-8 h-8 text-[#ddd] mb-3"/>
                    <p className="text-sm font-semibold text-[#0a0a0a]">No history yet</p>
                    <p className="text-[#aaa] text-xs mt-1">Your conversations will appear here</p>
                  </div>
                ) : sessions.map(session => (
                  <button key={session.id} onClick={() => loadSession(session)}
                    className={`w-full flex items-start gap-3 px-4 py-3 border-b border-[#f5f5f5] hover:bg-[#f9f9f7] text-left transition-all group ${activeId === session.id ? 'bg-[#f0f9f4] border-l-2 border-l-[#1a6b3a]' : ''}`}>
                    <div className="w-8 h-8 bg-[#f9f9f7] border border-[#e8e8e8] rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageCircle className="w-3.5 h-3.5 text-[#aaa]"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-[#0a0a0a] truncate">{session.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-2.5 h-2.5 text-[#ddd]"/>
                        <p className="text-[10px] text-[#aaa]">{formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}</p>
                        <span className="text-[#ddd]">·</span>
                        <p className="text-[10px] text-[#aaa]">{session.messages.length} messages</p>
                      </div>
                    </div>
                    <button onClick={e => deleteSession(session.id, e)}
                      className="p-1 rounded-lg text-[#ddd] hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                      <Trash2 className="w-3 h-3"/>
                    </button>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
