'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Image as ImageIcon, Video, X, Send, MessageCircle, Share2, ChevronDown, Loader2, MoreHorizontal, Smile } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Reaction = 'like' | 'love' | 'haha' | 'wow' | 'cry'
type Post = {
  id: string; title: string; body: string; author: string; avatar: string
  category: string; image_url: string; video_url: string
  like_count: number; love_count: number; haha_count: number; wow_count: number; cry_count: number
  replies: number; views: number; tags: string[]; created_at: string
}
type Comment = { id: string; post_id: string; author: string; avatar: string; body: string; image_url: string; created_at: string }

const REACTIONS: { type: Reaction; emoji: string; label: string; color: string }[] = [
  { type: 'like', emoji: '👍', label: 'Like', color: '#1a6b3a' },
  { type: 'love', emoji: '❤️', label: 'Love', color: '#e11d48' },
  { type: 'haha', emoji: '😂', label: 'Haha', color: '#d97706' },
  { type: 'wow', emoji: '😮', label: 'Wow', color: '#7c3aed' },
  { type: 'cry', emoji: '😢', label: 'Cry', color: '#2563eb' },
]
const CATS = ['All', 'Admissions', 'Navigation', 'Accommodation', 'Study Help', 'Registration', 'Campus Life', 'General']

export default function ForumPage() {
  const { student } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('All')
  const [query, setQuery] = useState('')
  const [showPost, setShowPost] = useState(false)
  const [myReactions, setMyReactions] = useState<Record<string, Reaction>>({})
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<string | null>(null)
  const [reactionPicker, setReactionPicker] = useState<string | null>(null)

  // Post creation
  const [postBody, setPostBody] = useState('')
  const [postCat, setPostCat] = useState('General')
  const [postFile, setPostFile] = useState<File | null>(null)
  const [postFilePreview, setPostFilePreview] = useState<string | null>(null)
  const [isVideo, setIsVideo] = useState(false)
  const [posting, setPosting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const pickerTimerRef = useRef<any>(null)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('forum_posts').select('*').order('created_at', { ascending: false })
    if (cat !== 'All') q = q.eq('category', cat)
    if (query) q = q.or(`title.ilike.%${query}%,body.ilike.%${query}%`)
    const { data } = await q
    setPosts((data as Post[]) || [])
    setLoading(false)
  }, [cat, query])

  useEffect(() => { loadPosts() }, [loadPosts])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('forum_reactions')
      if (stored) setMyReactions(JSON.parse(stored))
    } catch {}
  }, [])

  const handleReact = async (post: Post, reaction: Reaction) => {
    const prev = myReactions[post.id]
    const newReactions = { ...myReactions }
    const updates: Partial<Post> = {}

    if (prev === reaction) {
      // Unreact
      delete newReactions[post.id]
      updates[`${reaction}_count` as keyof Post] = Math.max(0, (post[`${reaction}_count` as keyof Post] as number) - 1) as any
    } else {
      // Change or new reaction
      if (prev) updates[`${prev}_count` as keyof Post] = Math.max(0, (post[`${prev}_count` as keyof Post] as number) - 1) as any
      newReactions[post.id] = reaction
      updates[`${reaction}_count` as keyof Post] = ((post[`${reaction}_count` as keyof Post] as number) + 1) as any
    }

    setMyReactions(newReactions)
    localStorage.setItem('forum_reactions', JSON.stringify(newReactions))

    // Optimistic update
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, ...updates } : p))
    setReactionPicker(null)

    // Persist to DB
    await supabase.from('forum_posts').update(updates).eq('id', post.id)
  }

  const loadComments = async (postId: string) => {
    const { data } = await supabase.from('forum_comments').select('*').eq('post_id', postId).order('created_at')
    setComments(prev => ({ ...prev, [postId]: (data as Comment[]) || [] }))
  }

  const toggleComments = async (postId: string) => {
    const next = new Set(expandedComments)
    if (next.has(postId)) { next.delete(postId) }
    else { next.add(postId); if (!comments[postId]) await loadComments(postId) }
    setExpandedComments(next)
  }

  const submitComment = async (postId: string) => {
    const body = (commentInputs[postId] || '').trim()
    if (!body || submittingComment) return
    setSubmittingComment(postId)
    const av = (student?.name || 'ST').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    await supabase.from('forum_comments').insert({ post_id: postId, author: student?.name || 'Anonymous', avatar: av, body })
    await supabase.from('forum_posts').update({ replies: (posts.find(p => p.id === postId)?.replies || 0) + 1 }).eq('id', postId)
    setCommentInputs(prev => ({ ...prev, [postId]: '' }))
    await loadComments(postId)
    setSubmittingComment(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setPostFile(f)
    setIsVideo(f.type.startsWith('video/'))
    const url = URL.createObjectURL(f)
    setPostFilePreview(url)
  }

  const submitPost = async () => {
    if (!postBody.trim()) return
    setPosting(true)
    let mediaUrl = ''
    if (postFile) {
      const ext = postFile.name.split('.').pop()
      const path = `forum/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('materials').upload(path, postFile, { contentType: postFile.type })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path)
        mediaUrl = publicUrl
      }
    }
    const av = (student?.name || 'ST').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    await supabase.from('forum_posts').insert({
      title: postBody.slice(0, 100), body: postBody,
      author: student?.name || 'Anonymous', avatar: av,
      category: postCat, tags: [],
      image_url: isVideo ? '' : mediaUrl,
      video_url: isVideo ? mediaUrl : '',
      replies: 0, views: 0, likes: 0,
      like_count: 0, love_count: 0, haha_count: 0, wow_count: 0, cry_count: 0,
    })
    setPosting(false); setShowPost(false); setPostBody(''); setPostFile(null); setPostFilePreview(null)
    loadPosts()
  }

  const totalReactions = (post: Post) => post.like_count + post.love_count + post.haha_count + post.wow_count + post.cry_count
  const topReactions = (post: Post) => REACTIONS.filter(r => (post[`${r.type}_count` as keyof Post] as number) > 0).sort((a, b) => (post[`${b.type}_count` as keyof Post] as number) - (post[`${a.type}_count` as keyof Post] as number)).slice(0, 3)

  const av = (student?.name || 'ST').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <AppShell>
      <TopBar title="Community" subtitle="Ask questions, share knowledge"/>
      <div className="max-w-2xl mx-auto px-3 lg:px-5 py-4 space-y-3 pb-24 lg:pb-6">

        {/* Create post box */}
        <div className="card p-3.5">
          <div className="flex items-center gap-2.5" onClick={() => setShowPost(true)}>
            <div className="w-8 h-8 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">{av}</span>
            </div>
            <div className="flex-1 bg-[#f9f9f7] rounded-full px-4 py-2 cursor-pointer hover:bg-[#f0f0f0] transition-colors">
              <p className="text-[#aaa] text-sm">What's on your mind, {student?.name?.split(' ')[0]}?</p>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#e8e8e8]">
            <button onClick={() => { setShowPost(true); setTimeout(() => fileRef.current?.click(), 100) }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7] transition-all">
              <ImageIcon className="w-4 h-4 text-[#1a6b3a]"/> Photo
            </button>
            <button onClick={() => { setShowPost(true); setTimeout(() => fileRef.current?.click(), 100) }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7] transition-all">
              <Video className="w-4 h-4 text-red-500"/> Video
            </button>
            <button onClick={() => setShowPost(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7] transition-all">
              <Smile className="w-4 h-4 text-amber-500"/> Feeling
            </button>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${cat === c ? 'bg-[#0a0a0a] text-white' : 'bg-white border border-[#e8e8e8] text-[#6b6b6b] hover:border-[#0a0a0a]'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Posts feed */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : posts.length === 0 ? (
          <div className="card p-10 text-center">
            <MessageCircle className="w-8 h-8 text-[#ddd] mx-auto mb-3"/>
            <p className="font-semibold text-[#0a0a0a] text-sm">No posts yet</p>
            <p className="text-[#aaa] text-xs mt-1">Be the first to start a conversation!</p>
            <button onClick={() => setShowPost(true)} className="btn-primary mt-4 mx-auto">Create Post</button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => {
              const myReaction = myReactions[post.id]
              const myR = myReaction ? REACTIONS.find(r => r.type === myReaction) : null
              const topR = topReactions(post)
              const total = totalReactions(post)
              const isExpanded = expandedComments.has(post.id)
              const postComments = comments[post.id] || []

              return (
                <div key={post.id} className="card overflow-hidden animate-fade-in" onClick={() => setReactionPicker(null)}>
                  {/* Post header */}
                  <div className="flex items-start gap-2.5 p-3.5 pb-2">
                    <div className="w-9 h-9 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      {post.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[#0a0a0a] text-sm leading-tight">{post.author}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[#aaa] text-[10px]">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                            <span className="text-[#aaa] text-[10px]">·</span>
                            <span className="badge badge-green text-[9px]">{post.category}</span>
                          </div>
                        </div>
                        <button className="p-1 rounded-full hover:bg-[#f9f9f7] text-[#aaa]"><MoreHorizontal className="w-4 h-4"/></button>
                      </div>
                    </div>
                  </div>

                  {/* Post body */}
                  <p className="px-3.5 pb-2 text-sm text-[#0a0a0a] leading-relaxed">{post.body}</p>

                  {/* Image */}
                  {post.image_url && (
                    <div className="relative">
                      <img src={post.image_url} alt="Post" className="w-full max-h-80 object-cover" loading="lazy"/>
                    </div>
                  )}

                  {/* Video */}
                  {post.video_url && (
                    <video src={post.video_url} controls className="w-full max-h-64 bg-black" preload="metadata"/>
                  )}

                  {/* Reaction summary */}
                  {(total > 0 || post.replies > 0) && (
                    <div className="flex items-center justify-between px-3.5 py-2 border-t border-[#f0f0f0]">
                      <div className="flex items-center gap-1">
                        {topR.map(r => (
                          <span key={r.type} className="text-sm">{r.emoji}</span>
                        ))}
                        {total > 0 && <span className="text-[11px] text-[#aaa] ml-0.5">{total}</span>}
                      </div>
                      {post.replies > 0 && (
                        <button onClick={() => toggleComments(post.id)} className="text-[11px] text-[#aaa] hover:underline">
                          {post.replies} comment{post.replies !== 1 ? 's' : ''}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="flex items-center border-t border-[#f0f0f0] mx-0 relative">
                    {/* React button */}
                    <div className="flex-1 relative">
                      <button
                        onClick={() => setReactionPicker(p => p === post.id ? null : post.id)}
                        onMouseEnter={() => { pickerTimerRef.current = setTimeout(() => setReactionPicker(post.id), 400) }}
                        onMouseLeave={() => clearTimeout(pickerTimerRef.current)}
                        className={`flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold transition-all hover:bg-[#f9f9f7] ${myR ? '' : 'text-[#6b6b6b]'}`}
                        style={{ color: myR?.color }}>
                        <span className="text-base">{myR ? myR.emoji : '👍'}</span>
                        <span>{myR ? myR.label : 'Like'}</span>
                      </button>
                      {/* Reaction picker */}
                      {reactionPicker === post.id && (
                        <div className="absolute bottom-full left-0 mb-1 bg-white border border-[#e8e8e8] rounded-full shadow-lg px-2 py-1.5 flex items-center gap-0.5 z-20 animate-scale-in"
                          onClick={e => e.stopPropagation()}>
                          {REACTIONS.map(r => (
                            <button key={r.type} onClick={() => handleReact(post, r.type)}
                              className={`text-xl p-1 rounded-full transition-all hover:scale-125 active:scale-95 ${myReaction === r.type ? 'ring-2 ring-[#1a6b3a] bg-[#f9f9f7]' : 'hover:bg-[#f9f9f7]'}`}
                              title={r.label}>
                              {r.emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => toggleComments(post.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7] transition-all border-x border-[#f0f0f0]">
                      <MessageCircle className="w-4 h-4"/> Comment
                    </button>
                    <button onClick={() => { navigator.share?.({ text: post.body }).catch(() => {}) }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7] transition-all">
                      <Share2 className="w-4 h-4"/> Share
                    </button>
                  </div>

                  {/* Comments section */}
                  {isExpanded && (
                    <div className="border-t border-[#f0f0f0] bg-[#fafafa] animate-fade-in">
                      {postComments.map(c => (
                        <div key={c.id} className="flex items-start gap-2 px-3.5 py-2.5">
                          <div className="w-7 h-7 bg-[#0a0a0a] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px]">{c.avatar}</div>
                          <div className="flex-1">
                            <div className="bg-white rounded-2xl px-3 py-2 border border-[#e8e8e8] inline-block max-w-full">
                              <p className="font-bold text-[#0a0a0a] text-xs">{c.author}</p>
                              <p className="text-[#0a0a0a] text-xs mt-0.5 leading-relaxed">{c.body}</p>
                            </div>
                            <p className="text-[#aaa] text-[10px] mt-1 ml-3">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
                          </div>
                        </div>
                      ))}
                      {/* Comment input */}
                      <div className="flex items-center gap-2 px-3.5 pb-3 pt-1">
                        <div className="w-7 h-7 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px]">{av}</div>
                        <div className="flex-1 flex items-center border border-[#e8e8e8] rounded-full bg-white px-3 py-1.5 gap-2">
                          <input value={commentInputs[post.id] || ''} onChange={e => setCommentInputs(p => ({ ...p, [post.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && submitComment(post.id)}
                            placeholder="Write a comment..." className="flex-1 text-xs outline-none bg-transparent placeholder-[#aaa]"/>
                          <button onClick={() => submitComment(post.id)} disabled={submittingComment === post.id || !commentInputs[post.id]?.trim()} className="text-[#1a6b3a] disabled:opacity-30">
                            {submittingComment === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Send className="w-3.5 h-3.5"/>}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showPost && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" onClick={() => !posting && setShowPost(false)}>
          <div className="absolute inset-0 bg-black/60"/>
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl lg:rounded-2xl animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e8e8]">
              <h2 className="font-black text-[#0a0a0a] text-base">Create Post</h2>
              <button onClick={() => setShowPost(false)} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#1a6b3a] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{av}</div>
                <div>
                  <p className="font-bold text-[#0a0a0a] text-sm">{student?.name}</p>
                  <select value={postCat} onChange={e => setPostCat(e.target.value)}
                    className="text-xs bg-[#f9f9f7] border border-[#e8e8e8] rounded-full px-2 py-0.5 text-[#6b6b6b] outline-none mt-0.5">
                    {CATS.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <textarea value={postBody} onChange={e => setPostBody(e.target.value)} rows={5} autoFocus
                placeholder={`What's on your mind, ${student?.name?.split(' ')[0]}?`}
                className="w-full text-sm outline-none resize-none placeholder-[#aaa] text-[#0a0a0a] leading-relaxed"/>

              {postFilePreview && (
                <div className="relative rounded-xl overflow-hidden border border-[#e8e8e8]">
                  {isVideo
                    ? <video src={postFilePreview} className="w-full max-h-48 object-contain bg-black" controls/>
                    : <img src={postFilePreview} alt="Preview" className="w-full max-h-48 object-cover"/>
                  }
                  <button onClick={() => { setPostFile(null); setPostFilePreview(null) }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"><X className="w-3.5 h-3.5"/></button>
                </div>
              )}

              <div className="border border-[#e8e8e8] rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6b6b6b]">Add to your post</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => fileRef.current?.click()} className="p-1.5 rounded-lg hover:bg-[#f9f9f7] transition-all">
                    <ImageIcon className="w-4 h-4 text-[#1a6b3a]"/>
                  </button>
                  <button onClick={() => fileRef.current?.click()} className="p-1.5 rounded-lg hover:bg-[#f9f9f7] transition-all">
                    <Video className="w-4 h-4 text-red-500"/>
                  </button>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange}/>

              <button onClick={submitPost} disabled={posting || !postBody.trim()}
                className="btn-primary w-full flex items-center justify-center gap-1.5">
                {posting ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Posting...</> : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
