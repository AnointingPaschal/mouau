'use client'
import { useState, useRef, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { useAuth } from '@/components/AuthProvider'
import { Send, RefreshCw, Bot, User, Sprout, Sparkles } from 'lucide-react'

type Msg = { role:'user'|'assistant'; content:string; time:string }
const now = () => new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})

const QUICK = ["How do I pay school fees?","Where is the library?","How to register courses?","Documents for clearance?","Where is the Admin Block?","When does clinic open?"]

function Bubble({ msg }: { msg:Msg }) {
  const isUser = msg.role==='user'
  return (
    <div className={`flex gap-2 ${isUser?'flex-row-reverse':''} animate-slide-up`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isUser?'bg-mouau':'bg-gold'}`}>
        {isUser?<User className="w-3 h-3 text-white"/>:<Bot className="w-3 h-3 text-white"/>}
      </div>
      <div className={`max-w-[80%] flex flex-col gap-0.5 ${isUser?'items-end':'items-start'}`}>
        <div className={`px-3 py-2 text-xs leading-relaxed ${isUser?'chat-user':'chat-ai'}`} style={{whiteSpace:'pre-wrap'}}>{msg.content}</div>
        <span className="text-[9px] text-gray-400 px-1">{msg.time}</span>
      </div>
    </div>
  )
}

function Typing() {
  return (
    <div className="flex gap-2 animate-fade-in">
      <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center flex-shrink-0"><Bot className="w-3 h-3 text-white"/></div>
      <div className="chat-ai px-3 py-2 flex items-center gap-1">
        {[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { student } = useAuth()
  const [msgs, setMsgs] = useState<Msg[]>([{
    role:'assistant',
    content:`Hello! I'm your MOUAU campus guide.\n\nI can help with:\n• Registration steps\n• Campus navigation\n• Study materials\n• Campus life & facilities\n\nWhat do you need?`,
    time:now()
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [msgs,loading])

  const send = async (text: string) => {
    if (!text.trim()||loading) return
    const userMsg:Msg = {role:'user',content:text.trim(),time:now()}
    setMsgs(prev=>[...prev,userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[...msgs,userMsg].map(m=>({role:m.role,content:m.content}))})})
      const data = await res.json()
      setMsgs(prev=>[...prev,{role:'assistant',content:data.content||'Sorry, please try again.',time:now()}])
    } catch {
      setMsgs(prev=>[...prev,{role:'assistant',content:'Connection error. Please try again.',time:now()}])
    } finally { setLoading(false); inputRef.current?.focus() }
  }

  return (
    <AppShell>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="bg-green-gradient px-3 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
              <Sprout className="w-4 h-4 text-white"/>
            </div>
            <div>
              <h1 className="text-white font-black text-xs leading-tight">MOUAU Assistant</h1>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/>
                <p className="text-white/60 text-[10px]">AI-powered campus guide</p>
              </div>
            </div>
          </div>
          <button onClick={()=>setMsgs([{role:'assistant',content:'Chat cleared! How can I help?',time:now()}])} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
            <RefreshCw className="w-3.5 h-3.5 text-white"/>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-mouau-bg">
          {msgs.map((m,i)=><Bubble key={i} msg={m}/>)}
          {loading&&<Typing/>}
          <div ref={bottomRef}/>
        </div>

        {/* Quick Questions */}
        {msgs.length===1&&!loading&&(
          <div className="px-3 py-1.5 bg-mouau-bg">
            <p className="text-[10px] text-gray-400 mb-1.5 flex items-center gap-1"><Sparkles className="w-3 h-3 text-gold"/> Quick questions</p>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {QUICK.map(q=>(
                <button key={q} onClick={()=>send(q)} className="flex-shrink-0 text-[10px] bg-white border border-gray-100 text-gray-600 px-2.5 py-1.5 rounded-xl hover:border-mouau hover:text-mouau transition-all shadow-sm">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t border-gray-100 px-3 py-2 flex-shrink-0">
          <div className="flex gap-2 items-center">
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(input)}}}
              placeholder="Ask anything about MOUAU..."
              className="flex-1 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-1 focus:ring-mouau/20 focus:border-mouau text-xs transition-all"
              disabled={loading}/>
            <button onClick={()=>send(input)} disabled={loading||!input.trim()}
              className="w-8 h-8 bg-mouau rounded-xl flex items-center justify-center hover:bg-mouau-mid transition-all disabled:opacity-50 flex-shrink-0">
              <Send className="w-3.5 h-3.5 text-white"/>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
