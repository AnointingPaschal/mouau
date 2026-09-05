'use client'
import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { getForumPosts, createForumPost, likePost } from '@/lib/db'
import { useAuth } from '@/components/AuthProvider'
import { MessageCircle, Eye, Heart, CheckCircle2, Plus, Search, X, Loader2 } from 'lucide-react'

type Post = { id: string; title: string; body: string; author: string; avatar: string; category: string; replies: number; views: number; likes: number; answered: boolean; tags: string[]; created_at: string }

const CATEGORIES = ['All','Admissions','Navigation','Accommodation','Study Help','Registration','Campus Life','Finance']
const CAT_COLORS: Record<string,string> = {
  Admissions:'bg-blue-100 text-blue-700', Navigation:'bg-green-100 text-green-700',
  Accommodation:'bg-amber-100 text-amber-700', 'Study Help':'bg-purple-100 text-purple-700',
  Registration:'bg-red-100 text-red-700', 'Campus Life':'bg-pink-100 text-pink-700',
  Finance:'bg-indigo-100 text-indigo-700'
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff/60000), hr = Math.floor(min/60), day = Math.floor(hr/24)
  if (day > 0) return `${day}d ago`
  if (hr > 0) return `${hr}h ago`
  return `${min}m ago`
}

export default function ForumPage() {
  const { student } = useAuth()
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // New post form
  const [npTitle, setNpTitle] = useState('')
  const [npBody, setNpBody] = useState('')
  const [npCategory, setNpCategory] = useState('General')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await getForumPosts(category === 'All' ? undefined : category)
    setPosts((data as Post[]) || [])
    setLoading(false)
  }, [category])

  useEffect(() => { load() }, [load])

  const filtered = posts.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.body.toLowerCase().includes(search.toLowerCase())
  )

  const handleLike = async (post: Post) => {
    if (liked.includes(post.id)) return
    setLiked(prev => [...prev, post.id])
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: p.likes + 1 } : p))
    await likePost(post.id, post.likes)
  }

  const handlePost = async () => {
    if (!npTitle.trim()) return
    setSubmitting(true)
    const initials = (student?.name || 'An').split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2)
    const { error } = await createForumPost({
      title: npTitle, body: npBody, author: student?.name || 'Anonymous',
      avatar: initials, category: npCategory, tags: []
    })
    setSubmitting(false)
    if (!error) { setShowNew(false); setNpTitle(''); setNpBody(''); load() }
  }

  return (
    <AppShell>
      <TopBar title="Community" subtitle="Ask questions, share knowledge"/>
      <div className="p-3 lg:p-4 space-y-3 animate-fade-in">

        {/* Header */}
        <div className="bg-green-gradient rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-black text-sm">Student Forum</h1>
              <p className="text-white/60 text-[10px]">Ask questions, connect with fellow students</p>
            </div>
            <button onClick={() => setShowNew(true)} className="flex items-center gap-1 bg-gold text-white font-semibold text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-gold-light transition-all">
              <Plus className="w-3 h-3"/> Post
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border border-gray-100 flex items-center gap-2 px-2.5 py-2">
          <Search className="w-3.5 h-3.5 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search posts..." className="flex-1 text-xs outline-none bg-transparent"/>
          {search&&<button onClick={()=>setSearch('')}><X className="w-3.5 h-3.5 text-gray-400"/></button>}
        </div>

        {/* Categories */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {CATEGORIES.map(cat=>(
            <button key={cat} onClick={()=>setCategory(cat)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${category===cat?'bg-mouau text-white':'bg-white text-gray-500 border border-gray-100'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-mouau animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <MessageCircle className="w-8 h-8 text-gray-200 mx-auto mb-2"/>
            <p className="font-semibold text-gray-400 text-xs">No posts yet</p>
            <p className="text-gray-300 text-[10px] mt-0.5">Be the first to ask a question!</p>
            <button onClick={()=>setShowNew(true)} className="btn-primary mt-3 mx-auto">Start Discussion</button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(post=>(
              <div key={post.id} className="card p-3">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 bg-mouau rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px]">
                    {post.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`badge ${CAT_COLORS[post.category]||'badge-green'} text-[9px]`}>{post.category}</span>
                      {post.answered&&<span className="badge bg-green-100 text-green-700 text-[9px] flex items-center gap-0.5"><CheckCircle2 className="w-2 h-2"/>Answered</span>}
                    </div>
                    <p className="font-bold text-mouau-dark text-xs mt-0.5 leading-tight">{post.title}</p>
                    {post.body&&<p className="text-gray-500 text-[10px] mt-0.5 line-clamp-2 leading-relaxed">{post.body}</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-gray-400 font-medium">{post.author}</span>
                      <span className="text-[10px] text-gray-300">{timeAgo(post.created_at)}</span>
                      <button onClick={()=>handleLike(post)}
                        className={`flex items-center gap-0.5 text-[10px] transition-colors ${liked.includes(post.id)?'text-red-500':'text-gray-400 hover:text-red-400'}`}>
                        <Heart className={`w-3 h-3 ${liked.includes(post.id)?'fill-current':''}`}/> {post.likes}
                      </button>
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <MessageCircle className="w-3 h-3"/> {post.replies}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Post Modal */}
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-3">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setShowNew(false)}/>
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-4 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-black text-mouau-dark text-sm">New Post</h2>
                <button onClick={()=>setShowNew(false)} className="p-1 rounded-full bg-gray-100"><X className="w-4 h-4"/></button>
              </div>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Question or Topic *</label>
                  <input value={npTitle} onChange={e=>setNpTitle(e.target.value)} className="input" placeholder="What would you like to ask?"/>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Category</label>
                  <select value={npCategory} onChange={e=>setNpCategory(e.target.value)} className="input py-1.5 text-[10px]">
                    {CATEGORIES.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Details (optional)</label>
                  <textarea rows={3} value={npBody} onChange={e=>setNpBody(e.target.value)} className="input resize-none" placeholder="Add more context..."/>
                </div>
                <button onClick={handlePost} disabled={submitting||!npTitle.trim()} className="btn-primary w-full flex items-center justify-center gap-1.5">
                  {submitting?<><Loader2 className="w-3 h-3 animate-spin"/>Posting...</>:'Post Question'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
