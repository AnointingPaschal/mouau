'use client'
import { useState, useEffect } from 'react'
import AdminShell from '@/components/AdminShell'
import { createClient } from '@supabase/supabase-js'
import {
  MessageCircle, Trash2, Pin, PinOff, Eye, Search,
  RefreshCw, Flag, ThumbsUp, CornerDownRight, ChevronDown,
  ChevronUp, AlertTriangle, CheckCircle2, Loader2, Hash,
  TrendingUp, BookOpen, Home, Users, Compass, Filter,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function db() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  return createClient(url, key, { auth: { persistSession: false } })
}

type Post = {
  id: string; title: string; body: string; author: string; author_id: string
  category: string; image_url: string; like_count: number; love_count: number
  haha_count: number; wow_count: number; cry_count: number
  replies: number; pinned: boolean; reported: boolean; created_at: string
}
type Comment = {
  id: string; post_id: string; author: string; body: string
  like_count: number; reply_count: number; created_at: string
}

const CATS = ['All','Admissions','Registration','Study Help','Campus Life','Navigation','Accommodation','General']
const CAT_COLORS: Record<string,string> = {
  Admissions:'#d97706', Registration:'#1e3a8a', 'Study Help':'#7c3aed',
  'Campus Life':'#0891b2', Navigation:'#059669', Accommodation:'#b91c1c', General:'#6b6b6b',
}

function CatBadge({ cat }: { cat: string }) {
  const color = CAT_COLORS[cat] || '#1a6b3a'
  return (
    <span className="text-[9px] font-black px-2 py-0.5 rounded-full border"
      style={{ color, borderColor: color + '40', background: color + '12' }}>
      {cat}
    </span>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = (name || 'ST').split(' ').map((w:string) => w[0]).join('').toUpperCase().slice(0,2)
  const colors = ['#1a6b3a','#1e3a8a','#7c3aed','#b91c1c','#d97706','#0891b2']
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length]
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-[10px]"
      style={{ background: bg }}>{initials}</div>
  )
}

export default function AdminForum() {
  const client = db()
  const [posts, setPosts]         = useState<Post[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [cat, setCat]             = useState('All')
  const [filter, setFilter]       = useState<'all'|'reported'|'pinned'>('all')
  const [expanded, setExpanded]   = useState<string|null>(null)
  const [comments, setComments]   = useState<Record<string, Comment[]>>({})
  const [loadingCmts, setLoadingCmts] = useState<string|null>(null)
  const [toast, setToast]         = useState('')
  const [stats, setStats]         = useState({ total: 0, reported: 0, pinned: 0, today: 0 })

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchPosts = async () => {
    setLoading(true)
    let q = client.from('forum_posts').select('*').order('created_at', { ascending: false })
    if (cat !== 'All') q = q.eq('category', cat)
    if (filter === 'reported') q = q.eq('reported', true)
    if (filter === 'pinned') q = q.eq('pinned', true)
    if (search.trim()) q = q.ilike('title', `%${search.trim()}%`)
    const { data } = await q.limit(100)
    const all = data || []
    setPosts(all)
    const today = new Date(); today.setHours(0,0,0,0)
    setStats({
      total: all.length,
      reported: all.filter((p:Post) => p.reported).length,
      pinned: all.filter((p:Post) => p.pinned).length,
      today: all.filter((p:Post) => new Date(p.created_at) >= today).length,
    })
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [cat, filter])

  const loadComments = async (postId: string) => {
    if (expanded === postId) { setExpanded(null); return }
    setExpanded(postId)
    if (comments[postId]) return
    setLoadingCmts(postId)
    const { data } = await client.from('forum_comments').select('*')
      .eq('post_id', postId).order('created_at', { ascending: true })
    setComments(prev => ({ ...prev, [postId]: data || [] }))
    setLoadingCmts(null)
  }

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post and all its comments?')) return
    await client.from('forum_posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
    notify('Post deleted')
  }

  const deleteComment = async (postId: string, commentId: string) => {
    if (!confirm('Delete this comment?')) return
    await client.from('forum_comments').delete().eq('id', commentId)
    setComments(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).filter(c => c.id !== commentId),
    }))
    notify('Comment deleted')
  }

  const togglePin = async (post: Post) => {
    await client.from('forum_posts').update({ pinned: !post.pinned }).eq('id', post.id)
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, pinned: !p.pinned } : p))
    notify(post.pinned ? 'Post unpinned' : 'Post pinned to top')
  }

  const clearReport = async (post: Post) => {
    await client.from('forum_posts').update({ reported: false }).eq('id', post.id)
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, reported: false } : p))
    notify('Report cleared')
  }

  const totalReactions = (p: Post) =>
    (p.like_count||0)+(p.love_count||0)+(p.haha_count||0)+(p.wow_count||0)+(p.cry_count||0)

  const filtered = posts.filter(p =>
    !search.trim() || p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.author?.toLowerCase().includes(search.toLowerCase()) ||
    p.body?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminShell>
      <div className="p-4 pb-20 max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8a8a8a] uppercase tracking-wider font-semibold">ADMIN</p>
            <h1 className="text-2xl font-black text-[#1a1a1a]">Forum</h1>
            <p className="text-sm text-[#6b6b6b]">Moderate posts & comments</p>
          </div>
          <button onClick={fetchPosts}
            className="w-9 h-9 rounded-full bg-[#f5f5f3] flex items-center justify-center active:scale-95 transition-transform">
            <RefreshCw className={`w-4 h-4 text-[#1a6b3a] ${loading ? 'animate-spin' : ''}`}/>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: stats.total, color: '#1a6b3a' },
            { label: 'Today', value: stats.today, color: '#0891b2' },
            { label: 'Pinned', value: stats.pinned, color: '#d97706' },
            { label: 'Reported', value: stats.reported, color: '#b91c1c' },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-[#8a8a8a] font-semibold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8a8a]"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchPosts()}
            placeholder="Search posts, authors..."
            className="input-field pl-9 pr-4"/>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(['all','reported','pinned'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex-shrink-0 ${
                filter === f
                  ? f === 'reported' ? 'bg-red-600 text-white border-red-600'
                    : f === 'pinned' ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-[#1a6b3a] text-white border-[#1a6b3a]'
                  : 'bg-white text-[#6b6b6b] border-[#e8e8e8]'
              }`}>
              {f === 'reported' && <Flag className="w-3 h-3 inline mr-1"/>}
              {f === 'pinned' && <Pin className="w-3 h-3 inline mr-1"/>}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <div className="w-px bg-[#e8e8e8] flex-shrink-0"/>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex-shrink-0 ${
                cat === c ? 'bg-[#1a3a2a] text-white border-[#1a3a2a]' : 'bg-white text-[#6b6b6b] border-[#e8e8e8]'
              }`}>{c}</button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#1a6b3a]"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <MessageCircle className="w-8 h-8 text-[#d0d0d0] mx-auto mb-2"/>
            <p className="text-[#8a8a8a] font-medium">No posts found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(post => (
              <div key={post.id}
                className={`card overflow-hidden ${post.reported ? 'ring-2 ring-red-200' : ''} ${post.pinned ? 'ring-2 ring-amber-200' : ''}`}>

                {/* Report / Pin badges */}
                {(post.reported || post.pinned) && (
                  <div className="flex gap-2 px-4 pt-3">
                    {post.reported && (
                      <span className="flex items-center gap-1 text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        <Flag className="w-3 h-3"/> REPORTED
                      </span>
                    )}
                    {post.pinned && (
                      <span className="flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                        <Pin className="w-3 h-3"/> PINNED
                      </span>
                    )}
                  </div>
                )}

                <div className="p-4">
                  {/* Author row */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <Avatar name={post.author}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1a1a1a] truncate">{post.author}</p>
                      <p className="text-[10px] text-[#8a8a8a]">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <CatBadge cat={post.category}/>
                  </div>

                  {/* Content */}
                  {post.title && <p className="font-black text-[#1a1a1a] text-sm mb-1">{post.title}</p>}
                  <p className="text-[#4a4a4a] text-xs leading-relaxed line-clamp-3">{post.body}</p>

                  {post.image_url && (
                    <img src={post.image_url} alt="" className="mt-2 rounded-xl w-full max-h-40 object-cover"/>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-[#8a8a8a]">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3"/> {totalReactions(post)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3"/> {post.replies || 0} comments
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button onClick={() => togglePin(post)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                        post.pinned
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-[#f5f5f3] text-[#4a4a4a] border-[#e8e8e8]'
                      }`}>
                      {post.pinned ? <PinOff className="w-3 h-3"/> : <Pin className="w-3 h-3"/>}
                      {post.pinned ? 'Unpin' : 'Pin'}
                    </button>

                    {post.reported && (
                      <button onClick={() => clearReport(post)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 active:scale-95 transition-all">
                        <CheckCircle2 className="w-3 h-3"/> Clear Report
                      </button>
                    )}

                    <button onClick={() => loadComments(post.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#f5f5f3] text-[#4a4a4a] border border-[#e8e8e8] active:scale-95 transition-all">
                      {expanded === post.id ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                      Comments
                    </button>

                    <button onClick={() => deletePost(post.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200 active:scale-95 transition-all ml-auto">
                      <Trash2 className="w-3 h-3"/> Delete
                    </button>
                  </div>
                </div>

                {/* Comments */}
                {expanded === post.id && (
                  <div className="border-t border-[#f0f0ee] bg-[#fafaf8]">
                    {loadingCmts === post.id ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-[#1a6b3a]"/>
                      </div>
                    ) : (comments[post.id] || []).length === 0 ? (
                      <p className="text-center text-[#8a8a8a] text-xs py-4">No comments yet</p>
                    ) : (
                      <div className="divide-y divide-[#f0f0ee]">
                        {(comments[post.id] || []).map(cmt => (
                          <div key={cmt.id} className="flex items-start gap-2.5 p-3">
                            <CornerDownRight className="w-3 h-3 text-[#c0c0c0] mt-1 flex-shrink-0"/>
                            <Avatar name={cmt.author}/>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-[#1a1a1a]">{cmt.author}</p>
                                <p className="text-[10px] text-[#8a8a8a]">
                                  {formatDistanceToNow(new Date(cmt.created_at), { addSuffix: true })}
                                </p>
                              </div>
                              <p className="text-xs text-[#4a4a4a] mt-0.5 leading-relaxed">{cmt.body}</p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-[#8a8a8a]">
                                <span>👍 {cmt.like_count || 0}</span>
                                <span>↩ {cmt.reply_count || 0}</span>
                              </div>
                            </div>
                            <button onClick={() => deleteComment(post.id, cmt.id)}
                              className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform">
                              <Trash2 className="w-3 h-3 text-red-500"/>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]"/> {toast}
        </div>
      )}
    </AdminShell>
  )
}
