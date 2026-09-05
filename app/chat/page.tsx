'use client'
import { useState, useRef, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { Send, Loader2, Bot, RefreshCw, Sparkles } from 'lucide-react'

type Msg = { role:'user'|'assistant'; content:string; model?:string }

const SUGGESTIONS = [
  'How do I pay my school fees?',
  'Where is the University Library?',
  'What documents do I need for clearance?',
  'How do I register my courses online?',
  'How do I find the admin block?',
]

export default function ChatPage() {
  const { student } = useAuth()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text?: string) => {
    const q = (text || input).trim()
    if (!q || loading) return
    setInput('')
    const newMsg: Msg = { role:'user', content:q }
    const updated = [...messages, newMsg]
    setMessages(updated)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated.map(m => ({ role:m.role, content:m.content })) })
      })
      const data = await res.json()
      setMessages([...updated, { role:'assistant', content:data.content, model:data.model }])
    } catch {
      setMessages([...updated, { role:'assistant', content:'Connection error. Please try again.' }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  return (
    <AppShell>
      <TopBar title="AI Assistant" subtitle="Ask anything about MOUAU"/>
      <div className="flex flex-col h-[calc(100vh-100px)] lg:h-[calc(100vh-60px)]">
        <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4 max-w-2xl w-full mx-auto">

          {messages.length === 0 && (
            <div className="animate-fade-in">
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-[#0a0a0a] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5 text-[#1a6b3a]"/>
                </div>
                <h2 className="font-black text-[#0a0a0a] text-base">MOUAU AI Assistant</h2>
                <p className="text-[#6b6b6b] text-xs mt-1 max-w-xs mx-auto">Ask me anything about MOUAU — registration, campus navigation, fees, or academic queries.</p>
              </div>
              <div className="section-label mb-3 justify-center">QUICK QUESTIONS</div>
              <div className="space-y-1.5">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="w-full text-left p-3 border border-[#e8e8e8] rounded-xl text-sm text-[#0a0a0a] hover:border-[#1a6b3a]/40 hover:bg-[#f9f9f7] transition-all font-medium">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role==='user'?'justify-end':'justify-start'} animate-fade-in`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 bg-[#0a0a0a] rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-[#1a6b3a]"/>
                </div>
              )}
              <div className={`max-w-[82%] ${msg.role==='user'?'chat-user px-4 py-2.5':'chat-ai px-4 py-3'}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.model && msg.role === 'assistant' && (
                  <p className="text-[10px] text-[#aaa] mt-1.5">via {msg.model.split('/').pop()?.split(':')[0]}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="w-6 h-6 bg-[#0a0a0a] rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
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
        <div className="border-t border-[#e8e8e8] bg-white p-3 pb-4 lg:pb-3">
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            {messages.length > 0 && (
              <button onClick={() => setMessages([])} className="p-2 rounded-lg border border-[#e8e8e8] text-[#aaa] hover:text-[#0a0a0a] hover:border-[#0a0a0a] transition-all flex-shrink-0">
                <RefreshCw className="w-3.5 h-3.5"/>
              </button>
            )}
            <div className="flex-1 flex items-center border border-[#e8e8e8] rounded-xl px-3 py-2 focus-within:border-[#1a6b3a] transition-colors bg-white">
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask about MOUAU..."
                className="flex-1 text-sm outline-none bg-transparent text-[#0a0a0a] placeholder-[#aaa]"/>
            </div>
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="p-2 bg-[#1a6b3a] text-white rounded-xl hover:bg-[#145530] disabled:opacity-50 transition-all flex-shrink-0">
              <Send className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
