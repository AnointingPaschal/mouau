'use client'
import { useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { FORUM_POSTS } from '@/lib/data'
import { useAuth } from '@/components/AuthProvider'
import {
  MessageSquare, ThumbsUp, Eye, CheckCircle2, Search,
  Plus, X, Tag, ChevronRight, Users, TrendingUp, Clock
} from 'lucide-react'

const CATEGORIES = ['All','Admissions','Navigation','Accommodation','Study Help','Registration','Campus Life','Finance']

const CAT_COLORS: Record<string,string> = {
  Admissions:'bg-blue-100 text-blue-700',Navigation:'bg-green-100 text-green-700',
  Accommodation:'bg-amber-100 text-amber-700','Study Help':'bg-purple-100 text-purple-700',
  Registration:'bg-red-100 text-red-700','Campus Life':'bg-pink-100 text-pink-700',
  Finance:'bg-indigo-100 text-indigo-700'
}

const AVATAR_COLORS = ['bg-mouau','bg-gold','bg-purple-600','bg-blue-600','bg-pink-600','bg-teal-600']

export default function ForumPage() {
  const { student } = useAuth()
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState<(typeof FORUM_POSTS)[0] | null>(null)
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newCat, setNewCat] = useState('Study Help')
  const [posts, setPosts] = useState(FORUM_POSTS)
  const [toast, setToast] = useState('')

  const filtered = posts.filter(p => {
    const matchCat = category === 'All' || p.category === category
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.body.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const toggleLike = (id: string) => {
    setLiked(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 3000)
  }

  const submitPost = () => {
    if (!newTitle.trim() || !newBody.trim()) return
    const newPost = {
      id: Date.now().toString(), title: newTitle, body: newBody,
      author: student?.name || 'Anonymous', avatar: student?.avatar || 'AN',
      category: newCat, replies: 0, views: 1, likes: 0,
      time: 'Just now', answered: false, tags: [newCat.toLowerCase()]
    }
    setPosts(prev => [newPost, ...prev])
    setNewTitle(''); setNewBody(''); setShowNew(false)
    showToast('Post submitted successfully!')
  }

  const avatarColor = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length]

  return (
    <AppShell>
      <TopBar title="Community Forum" subtitle="Ask questions, share knowledge"/>
      <div className="p-4 lg:p-6 space-y-5 animate-fade-in">

        {/* Toast */}
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-mouau text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-slide-up">
            <CheckCircle2 className="w-4 h-4 text-green-300"/>
            <span className="text-sm font-medium">{toast}</span>
          </div>
        )}

        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-black text-2xl">Community Forum</h1>
              <p className="text-white/70 text-sm mt-0.5">Connect, ask, and help fellow MOUAU students</p>
            </div>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 bg-gold text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-gold-light shadow-md transition-all">
              <Plus className="w-4 h-4"/> Ask
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              {label:'Posts', value:posts.length, icon:MessageSquare},
              {label:'Answered', value:posts.filter(p=>p.answered).length, icon:CheckCircle2},
              {label:'Members', value:'2.4k', icon:Users},
            ].map(({label,value,icon:Icon}) => (
              <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                <Icon className="w-4 h-4 text-gold mx-auto mb-1"/>
                <div className="text-white font-black text-xl">{value}</div>
                <div className="text-white/60 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 px-3 py-2.5">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..." className="flex-1 text-sm outline-none bg-transparent"/>
          {search && <button onClick={() => setSearch('')}><X className="w-4 h-4 text-gray-400"/></button>}
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                category===c ? 'bg-mouau text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-100 hover:bg-mouau-surface'
              }`}>{c}</button>
          ))}
        </div>

        {/* Sort Tabs */}
        <div className="flex items-center gap-4 text-xs">
          {[{icon:TrendingUp,label:'Trending'},{icon:Clock,label:'Recent'},{icon:CheckCircle2,label:'Answered'}].map(({icon:Icon,label},i) => (
            <button key={label} className={`flex items-center gap-1.5 pb-1.5 border-b-2 transition-all font-medium ${
              i===0 ? 'border-mouau text-mouau' : 'border-transparent text-gray-400 hover:text-mouau'
            }`}>
              <Icon className="w-3.5 h-3.5"/>{label}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-3">
          {filtered.map((post, idx) => (
            <button key={post.id} onClick={() => setSelected(post)}
              className="w-full card card-hover p-4 text-left animate-slide-up">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 ${avatarColor(idx)} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white font-bold text-xs">{post.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <span className={`badge text-[10px] ${CAT_COLORS[post.category]||'badge-green'}`}>{post.category}</span>
                    {post.answered && (
                      <span className="badge bg-green-100 text-green-700 text-[10px] flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5"/> Answered
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-mouau-dark text-sm leading-snug">{post.title}</h3>
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">{post.body}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3"/> {post.replies}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Eye className="w-3 h-3"/> {post.views}
                    </span>
                    <button onClick={e => { e.stopPropagation(); toggleLike(post.id) }}
                      className={`text-xs flex items-center gap-1 transition-colors ${liked.has(post.id) ? 'text-mouau font-semibold' : 'text-gray-400'}`}>
                      <ThumbsUp className="w-3 h-3"/> {post.likes + (liked.has(post.id) ? 1 : 0)}
                    </button>
                    <span className="text-xs text-gray-300 ml-auto">{post.time}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1"/>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="card p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
              <p className="font-semibold text-gray-400">No posts found</p>
              <p className="text-gray-300 text-sm mt-1">Be the first to ask!</p>
              <button onClick={() => setShowNew(true)} className="btn-primary mt-4 text-sm px-5 py-2">
                Ask a Question
              </button>
            </div>
          )}
        </div>

        {/* Post Detail Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)}/>
            <div className="relative w-full lg:max-w-2xl bg-white rounded-t-3xl lg:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge text-xs ${CAT_COLORS[selected.category]||'badge-green'}`}>{selected.category}</span>
                  {selected.answered && <span className="badge bg-green-100 text-green-700 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Answered</span>}
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-full bg-gray-100"><X className="w-4 h-4"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <h2 className="font-black text-mouau-dark text-lg leading-tight">{selected.title}</h2>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="font-medium text-gray-600">{selected.author}</span>
                  <span>·</span><span>{selected.time}</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{selected.body}</p>
                <div className="flex flex-wrap gap-2">
                  {selected.tags.map(t => (
                    <span key={t} className="flex items-center gap-1 text-xs text-mouau bg-mouau-surface px-2.5 py-1 rounded-full">
                      <Tag className="w-2.5 h-2.5"/>#{t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                  <button onClick={() => toggleLike(selected.id)}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors px-4 py-2 rounded-xl ${
                      liked.has(selected.id) ? 'bg-mouau-surface text-mouau' : 'text-gray-400 hover:bg-gray-50'
                    }`}>
                    <ThumbsUp className="w-4 h-4"/>
                    {selected.likes + (liked.has(selected.id) ? 1 : 0)} Helpful
                  </button>
                </div>
                <div className="bg-mouau-surface rounded-2xl p-4">
                  <p className="text-xs font-semibold text-mouau mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5"/>{selected.replies} Replies
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    {selected.answered
                      ? 'This question has been answered by the community. Check the MOUAU portal or Admin Block for official confirmation.'
                      : 'No replies yet. Be the first to help! You can also ask our AI Assistant for quick answers.'}
                  </p>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input placeholder="Write a reply..." className="input text-sm py-2.5"/>
                  <button className="btn-primary px-4 py-2.5 text-sm">Reply</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Post Modal */}
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNew(false)}/>
            <div className="relative w-full lg:max-w-lg bg-white rounded-t-3xl lg:rounded-2xl shadow-2xl p-5 animate-slide-up">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black text-mouau-dark text-xl">Ask a Question</h2>
                <button onClick={() => setShowNew(false)} className="p-2 rounded-full bg-gray-100"><X className="w-4 h-4"/></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Category</label>
                  <select value={newCat} onChange={e => setNewCat(e.target.value)} className="input text-sm py-2">
                    {CATEGORIES.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Question Title</label>
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    className="input" placeholder="e.g. How do I register my courses on the portal?"/>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Details</label>
                  <textarea value={newBody} onChange={e => setNewBody(e.target.value)}
                    className="input resize-none" rows={4}
                    placeholder="Describe your question in detail..."/>
                </div>
                <button onClick={submitPost} disabled={!newTitle.trim() || !newBody.trim()}
                  className="btn-primary w-full">Post Question</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
