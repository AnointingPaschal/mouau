'use client'
import { useState, useRef, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { Send, MessageCircle, Sparkles, RefreshCw, Bot, User, Sprout } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string; time: string }

const QUICK_QUESTIONS = [
  "How do I pay my school fees?",
  "Where is the library?",
  "How do I register my courses?",
  "What documents do I need for clearance?",
  "Where can I find past questions?",
  "What time does the clinic open?",
  "How do I get my student ID?",
  "Where is the Admin Block?",
]

function formatTime() {
  return new Date().toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' })
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-slide-up`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-mouau' : 'bg-gold'}`}>
        {isUser ? <User className="w-4 h-4 text-white"/> : <Bot className="w-4 h-4 text-white"/>}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 text-sm leading-relaxed ${isUser ? 'chat-user' : 'chat-ai'}`}
          style={{ whiteSpace: 'pre-wrap' }}>
          {msg.content}
        </div>
        <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white"/>
      </div>
      <div className="chat-ai px-4 py-3 flex items-center gap-1">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay:`${i*0.15}s` }}/>
        ))}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { student } = useAuth()
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Welcome to MOUAU FreshStart Assistant! 🌿\n\nI'm your AI campus guide. I can help you with:\n• Campus navigation & finding locations\n• Registration & admission process\n• Study materials & past questions\n• Campus life & facilities\n• Academic policies & procedures\n\nWhat would you like to know?`,
    time: formatTime()
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = { role: 'user', content: text.trim(), time: formatTime() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
        })
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content || 'Sorry, I could not get a response. Please try again.',
        time: formatTime()
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please check your internet and try again.',
        time: formatTime()
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared! How can I help you today? 🌿',
      time: formatTime()
    }])
  }

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-0px)] lg:h-screen">
        {/* Header */}
        <div className="bg-green-gradient px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white"/>
            </div>
            <div>
              <h1 className="text-white font-black text-base leading-tight">MOUAU Assistant</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-soft"/>
                <p className="text-white/70 text-xs">AI-powered campus guide</p>
              </div>
            </div>
          </div>
          <button onClick={clearChat} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
            <RefreshCw className="w-4 h-4 text-white"/>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-mouau-bg">
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg}/>)}
          {loading && <TypingIndicator/>}
          <div ref={bottomRef}/>
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && !loading && (
          <div className="px-4 pb-2 bg-mouau-bg">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-gold"/> Quick questions
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="flex-shrink-0 text-xs bg-white border border-gray-100 text-gray-600 px-3 py-2 rounded-xl hover:border-mouau hover:text-mouau transition-all shadow-sm">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t border-gray-100 px-4 py-3 pb-safe">
          <div className="flex gap-3 items-center max-w-3xl mx-auto">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              placeholder="Ask anything about MOUAU..."
              className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-mouau/20 focus:border-mouau text-sm transition-all"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="w-11 h-11 bg-mouau rounded-xl flex items-center justify-center hover:bg-mouau-mid transition-all disabled:opacity-50 shadow-sm flex-shrink-0">
              <Send className="w-4 h-4 text-white"/>
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-300 mt-2">
            Powered by AI · Responses may not always be accurate · Verify with school officials
          </p>
        </div>
      </div>
    </AppShell>
  )
}
