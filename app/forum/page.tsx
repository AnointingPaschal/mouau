'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import {
  X, Send, MessageCircle, Share2, Loader2, MoreHorizontal,
  Image as ImageIcon, Bold, Italic, Underline,
  List, Link, ThumbsUp, ArrowLeft, ChevronDown,
  Trash2, Edit2, Flag, AlertTriangle, ChevronUp, CornerDownRight,
  TrendingUp, Clock, Flame, Hash, BookOpen, HelpCircle,
  Home, Users, Compass, Pencil,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Reaction = 'like'|'love'|'haha'|'wow'|'cry'
type Post = { id:string; title:string; body:string; author:string; avatar:string; author_id:string; category:string; image_url:string; video_url:string; like_count:number; love_count:number; haha_count:number; wow_count:number; cry_count:number; replies:number; created_at:string }
type Comment = { id:string; post_id:string; author:string; avatar:string; author_id:string; body:string; like_count:number; reply_count:number; created_at:string }
type Reply   = { id:string; comment_id:string; author:string; avatar:string; author_id:string; body:string; like_count:number; created_at:string }

const REACTIONS = [
  {type:'like' as Reaction, emoji:'👍', label:'Like',  color:'#1a6b3a'},
  {type:'love' as Reaction, emoji:'❤️', label:'Love',  color:'#e11d48'},
  {type:'haha' as Reaction, emoji:'😂', label:'Haha',  color:'#d97706'},
  {type:'wow'  as Reaction, emoji:'😮', label:'Wow',   color:'#7c3aed'},
  {type:'cry'  as Reaction, emoji:'😢', label:'Cry',   color:'#2563eb'},
]

const CATS = [
  { id:'All',          label:'All',           icon:Compass,      color:'#1a6b3a' },
  { id:'Admissions',   label:'Admissions',    icon:BookOpen,     color:'#d97706' },
  { id:'Registration', label:'Registration',  icon:Hash,         color:'#1e3a8a' },
  { id:'Study Help',   label:'Study Help',    icon:TrendingUp,   color:'#7c3aed' },
  { id:'Campus Life',  label:'Campus Life',   icon:Home,         color:'#0891b2' },
  { id:'Navigation',   label:'Navigation',    icon:Compass,      color:'#059669' },
  { id:'Accommodation',label:'Accommodation', icon:Home,         color:'#b91c1c' },
  { id:'General',      label:'General',       icon:Users,        color:'#6b6b6b' },
]
const POST_CATS = CATS.filter(c => c.id !== 'All').map(c => c.id)

const CAT_COLORS: Record<string,string> = Object.fromEntries(CATS.map(c => [c.id, c.color]))

// ─── Avatar ────────────────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#1a6b3a,#4ade80)',
  'linear-gradient(135deg,#1e3a8a,#60a5fa)',
  'linear-gradient(135deg,#7c3aed,#c084fc)',
  'linear-gradient(135deg,#b91c1c,#f87171)',
  'linear-gradient(135deg,#d97706,#fcd34d)',
  'linear-gradient(135deg,#0891b2,#67e8f9)',
]
function avatarGradient(name: string) {
  const i = (name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[i]
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm'|'md'|'lg' }) {
  const initials = (name || 'ST').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const s = size === 'sm' ? 'w-7 h-7 text-[9px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-9 h-9 text-[11px]'
  return (
    <div className={`${s} rounded-full flex items-center justify-center flex-shrink-0 text-white font-black shadow-sm`}
      style={{ background: avatarGradient(name) }}>
      {initials}
    </div>
  )
}

// ─── Category Badge ────────────────────────────────────────────────────────────
function CatBadge({ cat }: { cat: string }) {
  const color = CAT_COLORS[cat] || '#6b6b6b'
  return (
    <span className="text-[9px] font-black px-2 py-0.5 rounded-full border"
      style={{ color, borderColor: color + '40', background: color + '12' }}>
      {cat}
    </span>
  )
}

// ─── Notify ───────────────────────────────────────────────────────────────────
const notify = (recipientId:string, type:string, title:string, body:string, postId:string, actor:string) => {
  if (!recipientId?.trim()) return
  supabase.from('notifications').insert({ recipient_id:recipientId, type, title, body, post_id:postId, actor, read:false }).then(() => {})
  fetch('/api/push/send', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ studentId:recipientId, title, body, url:'/forum' }) }).catch(() => {})
}

// ─── Rich Toolbar ─────────────────────────────────────────────────────────────
function RichToolbar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement> }) {
  const exec = (cmd: string) => { editorRef.current?.focus(); document.execCommand(cmd, false) }
  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-t border-[#e8e8e8] bg-[#fafafa]">
      {[
        { icon: <Bold className="w-3.5 h-3.5"/>, cmd: 'bold' },
        { icon: <Italic className="w-3.5 h-3.5"/>, cmd: 'italic' },
        { icon: <Underline className="w-3.5 h-3.5"/>, cmd: 'underline' },
        { icon: <List className="w-3.5 h-3.5"/>, cmd: 'insertUnorderedList' },
      ].map(t => (
        <button key={t.cmd} onMouseDown={e => { e.preventDefault(); exec(t.cmd) }}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e8e8e8] text-[#6b6b6b] transition-colors">{t.icon}</button>
      ))}
      <div className="w-px h-4 bg-[#e8e8e8] mx-1"/>
      <button onMouseDown={e => { e.preventDefault(); const u = prompt('URL:'); if (u) { editorRef.current?.focus(); document.execCommand('createLink', false, u) } }}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e8e8e8] text-[#6b6b6b]"><Link className="w-3.5 h-3.5"/></button>
    </div>
  )
}

// ─── Reaction Picker ──────────────────────────────────────────────────────────
function ReactionPicker({ myReaction, onReact, onClose }: { myReaction?: Reaction; onReact:(r:Reaction)=>void; onClose:()=>void }) {
  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white border border-[#e8e8e8] rounded-2xl shadow-2xl px-3 py-2.5 flex items-end gap-2 z-30"
      onClick={e => e.stopPropagation()}>
      {REACTIONS.map(r => (
        <button key={r.type} onClick={() => { onReact(r.type); onClose() }}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all hover:scale-110 active:scale-95 ${myReaction === r.type ? 'bg-[#f0faf4]' : ''}`}>
          <span className="text-2xl leading-none">{r.emoji}</span>
          <span className="text-[8px] font-bold" style={{ color: r.color }}>{r.label}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Post Options Menu ────────────────────────────────────────────────────────
function PostMenu({ post, myId, onEdit, onDelete, onClose }: { post:Post; myId:string; onEdit:()=>void; onDelete:()=>void; onClose:()=>void }) {
  const own = post.author_id === myId
  return (
    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#e8e8e8] rounded-2xl shadow-2xl overflow-hidden z-30"
      onClick={e => e.stopPropagation()}>
      {own ? (
        <>
          <button onClick={() => { onEdit(); onClose() }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-[#0a0a0a] hover:bg-[#f9f9f7]">
            <Edit2 className="w-4 h-4 text-[#6b6b6b]"/> Edit post
          </button>
          <div className="h-px bg-[#f0f0f0]"/>
          <button onClick={() => { onDelete(); onClose() }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50">
            <Trash2 className="w-4 h-4"/> Delete
          </button>
        </>
      ) : (
        <button onClick={onClose}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-[#6b6b6b] hover:bg-[#f9f9f7]">
          <Flag className="w-4 h-4"/> Report
        </button>
      )}
    </div>
  )
}

// ─── Comment with Replies ─────────────────────────────────────────────────────
function CommentItem({ comment, myId, postId }: { comment:Comment; myId:string; postId:string }) {
  const { student } = useAuth()
  const [liked,       setLiked]       = useState(false)
  const [likeCount,   setLikeCount]   = useState(comment.like_count || 0)
  const [showReply,   setShowReply]   = useState(false)
  const [replies,     setReplies]     = useState<Reply[]>([])
  const [showReplies, setShowReplies] = useState(false)
  const [loaded,      setLoaded]      = useState(false)
  const [replyText,   setReplyText]   = useState('')
  const [submitting,  setSubmitting]  = useState(false)

  useEffect(() => {
    try { const k = `clike_${comment.id}_${myId}`; setLiked(localStorage.getItem(k) === '1') } catch {}
  }, [comment.id, myId])

  const loadReplies = async () => {
    const { data } = await supabase.from('forum_comment_replies').select('*').eq('comment_id', comment.id).order('created_at')
    setReplies((data as Reply[]) || []); setLoaded(true)
  }

  const toggleReplies = () => { if (!loaded) loadReplies(); setShowReplies(p => !p) }

  const likeComment = async () => {
    const k = `clike_${comment.id}_${myId}`
    if (liked) {
      setLiked(false); setLikeCount(n => Math.max(0, n - 1)); localStorage.removeItem(k)
      await supabase.from('forum_comments').update({ like_count: Math.max(0, likeCount - 1) }).eq('id', comment.id)
    } else {
      setLiked(true); setLikeCount(n => n + 1); localStorage.setItem(k, '1')
      await supabase.from('forum_comments').update({ like_count: likeCount + 1 }).eq('id', comment.id)
    }
  }

  const submitReply = async () => {
    if (!replyText.trim() || submitting) return
    setSubmitting(true)
    const av = (student?.name || 'ST').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    const { data } = await supabase.from('forum_comment_replies').insert({
      comment_id: comment.id, post_id: postId,
      author: student?.name || 'Anonymous', avatar: av, author_id: myId,
      body: replyText.trim(), like_count: 0
    }).select().single()
    await supabase.from('forum_comments').update({ reply_count: (comment.reply_count || 0) + 1 }).eq('id', comment.id)
    if (comment.author_id && comment.author_id !== myId)
      notify(comment.author_id, 'reply', `${student?.name} replied to your comment`, replyText.trim().slice(0, 80), postId, student?.name || '')
    setReplyText(''); setShowReply(false)
    if (data) setReplies(r => [...r, data as Reply])
    setShowReplies(true); setLoaded(true); setSubmitting(false)
  }

  const replyCount = replies.length || (comment.reply_count || 0)

  return (
    <div className="flex items-start gap-2.5 px-4 py-3.5 border-b border-[#f5f5f3] last:border-0">
      <Avatar name={comment.author} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="bg-[#f7f7f5] rounded-2xl rounded-tl-sm px-3 py-2.5 inline-block max-w-full">
          <p className="font-black text-[#0a0a0a] text-[11px]">{comment.author}</p>
          <p className="text-[#333] text-[12px] mt-0.5 leading-relaxed">{comment.body}</p>
        </div>
        <div className="flex items-center gap-3 mt-1.5 ml-1">
          <p className="text-[#bbb] text-[10px]">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</p>
          <button onClick={likeComment}
            className={`flex items-center gap-1 text-[10px] font-bold transition-all ${liked ? 'text-[#1a6b3a]' : 'text-[#bbb] hover:text-[#1a6b3a]'}`}>
            <ThumbsUp className="w-3 h-3" fill={liked ? 'currentColor' : 'none'} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <button onClick={() => setShowReply(p => !p)}
            className="text-[10px] font-bold text-[#bbb] hover:text-[#1a6b3a] transition-colors">Reply</button>
          {replyCount > 0 && (
            <button onClick={toggleReplies}
              className="flex items-center gap-1 text-[10px] font-bold text-[#1a6b3a]">
              {showReplies ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>

        {showReply && (
          <div className="flex items-center gap-2 mt-2">
            <Avatar name={student?.name || ''} size="sm" />
            <div className="flex-1 flex items-center border border-[#e0e0e0] rounded-full bg-white px-3 py-1.5 gap-2 focus-within:border-[#1a6b3a] transition-colors">
              <input value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitReply()}
                placeholder={`Reply to ${comment.author}…`}
                className="flex-1 text-[11px] outline-none bg-transparent placeholder-[#bbb]" />
              <button onClick={submitReply} disabled={submitting || !replyText.trim()} className="text-[#1a6b3a] disabled:opacity-30">
                {submitting ? <Loader2 className="w-3 h-3 animate-spin"/> : <Send className="w-3 h-3"/>}
              </button>
            </div>
          </div>
        )}

        {showReplies && replies.map(r => (
          <div key={r.id} className="flex items-start gap-2 mt-2.5 ml-1">
            <CornerDownRight className="w-3.5 h-3.5 text-[#ddd] flex-shrink-0 mt-1.5"/>
            <Avatar name={r.author} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="bg-[#f0f0ee] rounded-2xl rounded-tl-sm px-2.5 py-2 inline-block max-w-full">
                <p className="font-black text-[#0a0a0a] text-[11px]">{r.author}</p>
                <p className="text-[#333] text-[11px] mt-0.5 leading-relaxed">{r.body}</p>
              </div>
              <p className="text-[#bbb] text-[9px] mt-0.5 ml-1">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Post Editor ──────────────────────────────────────────────────────────────
function PostEditor({ editPost, onClose, onSaved }: { editPost?: Post; onClose: ()=>void; onSaved: ()=>void }) {
  const { student } = useAuth()
  const [cat, setCat]     = useState(editPost?.category || 'General')
  const [file, setFile]   = useState<File|null>(null)
  const [preview, setPrev]= useState<string|null>(editPost?.image_url || null)
  const [fileErr, setFileErr] = useState('')
  const [posting, setPosting] = useState(false)
  const edRef = useRef<HTMLDivElement>(null)
  const fRef  = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editPost && edRef.current) edRef.current.innerHTML = editPost.body }, [editPost])
  useEffect(() => {
    const fn = () => onClose()
    window.history.pushState({ modal: 'post-editor' }, '')
    window.addEventListener('popstate', fn)
    return () => window.removeEventListener('popstate', fn)
  }, [onClose])

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    if (!f.type.startsWith('image/')) { setFileErr('Only photos are allowed.'); return }
    if (f.size > 5 * 1024 * 1024) { setFileErr('Photo must be under 5 MB.'); return }
    setFileErr(''); setFile(f); setPrev(URL.createObjectURL(f))
  }

  const submit = async () => {
    const body = edRef.current?.innerHTML || ''
    if (!body.replace(/<[^>]*>/g, '').trim()) return
    setPosting(true)
    let url = editPost?.image_url || ''
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `forum/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('materials').upload(path, file, { contentType: file.type })
      if (!error) { const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path); url = publicUrl }
    }
    const av = (student?.name || 'ST').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    if (editPost) {
      await supabase.from('forum_posts').update({ body, category: cat, image_url: url, video_url: '' }).eq('id', editPost.id)
    } else {
      await supabase.from('forum_posts').insert({
        title: body.replace(/<[^>]*>/g, ' ').trim().slice(0, 100), body,
        author: student?.name || 'Anonymous', avatar: av, author_id: student?.idNumber || '',
        category: cat, tags: [], image_url: url, video_url: '',
        replies: 0, views: 0, likes: 0, like_count: 0, love_count: 0, haha_count: 0, wow_count: 0, cry_count: 0,
      })
    }
    setPosting(false); onSaved()
  }

  const catMeta = CATS.find(c => c.id === cat)

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e8e8] flex-shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center hover:bg-[#e8e8e8] transition-colors">
            <X className="w-4 h-4 text-[#0a0a0a]"/>
          </button>
          <h2 className="font-black text-[#0a0a0a] text-lg">{editPost ? 'Edit Post' : 'New Post'}</h2>
        </div>
        <button onClick={submit} disabled={posting}
          className="px-5 py-2 rounded-xl text-sm font-black text-white transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#1a6b3a,#145530)' }}>
          {posting ? <Loader2 className="w-4 h-4 animate-spin"/> : editPost ? 'Save' : 'Post'}
        </button>
      </div>

      {/* Author row + category */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b border-[#f0f0f0]">
        <Avatar name={student?.name || ''} size="lg" />
        <div>
          <p className="font-black text-[#0a0a0a] text-sm">{student?.name}</p>
          <div className="flex items-center gap-1 mt-1 bg-[#f5f5f3] rounded-lg px-2.5 py-1.5">
            {catMeta && <catMeta.icon className="w-3 h-3" style={{ color: catMeta.color }}/>}
            <select value={cat} onChange={e => setCat(e.target.value)}
              className="text-xs font-bold bg-transparent outline-none" style={{ color: catMeta?.color }}>
              {POST_CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-4 pt-3">
        <div ref={edRef} contentEditable suppressContentEditableWarning
          data-placeholder="What's on your mind? Ask a question, share an update…"
          className="min-h-full text-[16px] text-[#0a0a0a] outline-none leading-relaxed pb-20
            empty:before:content-[attr(data-placeholder)] empty:before:text-[#bbb] empty:before:pointer-events-none"/>
        {fileErr && <p className="text-red-500 text-xs mb-2 font-medium">{fileErr}</p>}
        {preview && (
          <div className="relative rounded-2xl overflow-hidden border border-[#e8e8e8] mb-4">
            <img src={preview} alt="" className="w-full max-h-64 object-cover"/>
            <button onClick={() => { setFile(null); setPrev(null) }}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80">
              <X className="w-4 h-4"/>
            </button>
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="flex-shrink-0 border-t border-[#e8e8e8] bg-white">
        <RichToolbar editorRef={edRef}/>
        <div className="flex items-center gap-1 px-4 py-2.5 border-t border-[#f0f0f0]">
          <span className="text-[10px] font-bold text-[#aaa] mr-1.5 uppercase tracking-wide">Add</span>
          <button onClick={() => fRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f0faf4] text-[#1a6b3a] text-xs font-bold hover:bg-[#e0f5ea] transition-colors">
            <ImageIcon className="w-3.5 h-3.5"/> Photo <span className="text-[9px] text-[#aaa] font-normal">max 5 MB</span>
          </button>
        </div>
        <input ref={fRef} type="file" accept="image/*" className="hidden" onChange={onFile}/>
      </div>
    </div>
  )
}

// ─── Full Post / Thread View ──────────────────────────────────────────────────
function PostView({ post, myReaction, onReact, onClose, myId }: { post:Post; myReaction?:Reaction; myId:string; onReact:(p:Post,r:Reaction)=>void; onClose:()=>void }) {
  const { student } = useAuth()
  const [comments,   setComments]  = useState<Comment[]>([])
  const [expanded,   setExpanded]  = useState(false)
  const [commentText,setText]      = useState('')
  const [submitting, setSubmitting]= useState(false)
  const [showPicker, setPicker]    = useState(false)

  useEffect(() => {
    const fn = () => onClose()
    window.history.pushState({ modal: 'post-view' }, '')
    window.addEventListener('popstate', fn)
    return () => window.removeEventListener('popstate', fn)
  }, [onClose])

  useEffect(() => {
    supabase.from('forum_comments').select('*').eq('post_id', post.id).order('created_at')
      .then(({ data }) => { if (data) setComments(data as Comment[]) })
  }, [post.id])

  const submitComment = async () => {
    if (!commentText.trim() || submitting) return
    setSubmitting(true)
    const av = (student?.name || 'ST').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    await supabase.from('forum_comments').insert({
      post_id: post.id, author: student?.name || 'Anonymous',
      avatar: av, author_id: myId, body: commentText.trim(), like_count: 0, reply_count: 0
    })
    await supabase.from('forum_posts').update({ replies: (post.replies || 0) + 1 }).eq('id', post.id)
    if (post.author_id && post.author_id !== myId)
      notify(post.author_id, 'comment', `${student?.name} commented on your post`, commentText.trim().slice(0, 80), post.id, student?.name || '')
    setText('')
    const { data } = await supabase.from('forum_comments').select('*').eq('post_id', post.id).order('created_at')
    if (data) setComments(data as Comment[])
    setSubmitting(false); setExpanded(true)
  }

  const handleReact = (r: Reaction) => {
    setPicker(false)
    if (post.author_id && post.author_id !== myId) {
      const rx = REACTIONS.find(x => x.type === r)
      notify(post.author_id, 'reaction', `${student?.name} reacted ${rx?.emoji} to your post`, '', post.id, student?.name || '')
    }
    onReact(post, r)
  }

  const myR    = myReaction ? REACTIONS.find(r => r.type === myReaction) : null
  const total  = post.like_count + post.love_count + post.haha_count + post.wow_count + post.cry_count
  const topR   = REACTIONS.filter(r => (post[`${r.type}_count` as keyof Post] as number) > 0)
    .sort((a, b) => (post[`${b.type}_count` as keyof Post] as number) - (post[`${a.type}_count` as keyof Post] as number))
    .slice(0, 3)
  const SHOW   = 3
  const visible = expanded ? comments : comments.slice(0, SHOW)
  const hidden  = comments.length - SHOW

  return (
    <div className="fixed inset-0 z-50 bg-[#f7f7f5] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e8e8e8] flex-shrink-0 bg-white">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center">
          <ArrowLeft className="w-4 h-4"/>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-black text-[#0a0a0a] text-sm truncate">{post.author}</p>
          <p className="text-[10px] text-[#aaa]">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
        </div>
        <CatBadge cat={post.category} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Post content */}
        <div className="bg-white border-b border-[#e8e8e8]">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={post.author} size="lg" />
              <div>
                <p className="font-black text-[#0a0a0a]">{post.author}</p>
                <p className="text-[10px] text-[#aaa]">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
              </div>
            </div>
            <div className="text-[14px] text-[#0a0a0a] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.body.replace(/\n/g, '<br/>') }}/>
            {post.image_url && <img src={post.image_url} alt="" className="w-full rounded-2xl mt-3 max-h-80 object-cover border border-[#e8e8e8]"/>}
            {post.video_url && <video src={post.video_url} controls className="w-full mt-3 rounded-2xl bg-black max-h-64"/>}
          </div>

          {/* Reaction counts */}
          {(total > 0 || post.replies > 0) && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-[#f0f0f0]">
              <div className="flex items-center gap-1">
                {topR.map(r => <span key={r.type} className="text-base">{r.emoji}</span>)}
                {total > 0 && <span className="text-[11px] text-[#aaa] ml-1 font-medium">{total}</span>}
              </div>
              {post.replies > 0 && <span className="text-[11px] text-[#aaa] font-medium">{post.replies} comment{post.replies !== 1 ? 's' : ''}</span>}
            </div>
          )}

          {/* Action bar */}
          <div className="flex border-t border-[#f0f0f0]">
            <div className="flex-1 relative">
              <button onClick={() => setPicker(p => !p)}
                className="flex items-center justify-center gap-1.5 w-full py-3 text-xs font-bold hover:bg-[#f5f5f3] transition-colors"
                style={{ color: myR ? myR.color : '#1a6b3a' }}>
                {myR
                  ? <><span className="text-lg">{myR.emoji}</span><span>{myR.label}</span></>
                  : <><ThumbsUp className="w-4 h-4" strokeWidth={2.5}/><span>Like</span></>}
              </button>
              {showPicker && <ReactionPicker myReaction={myReaction} onReact={handleReact} onClose={() => setPicker(false)}/>}
            </div>
            <button onClick={() => document.getElementById('cmt-in')?.focus()}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f5f5f3] border-x border-[#f0f0f0] transition-colors">
              <MessageCircle className="w-4 h-4"/> Comment
            </button>
            <button onClick={() => navigator.share?.({ text: post.body.replace(/<[^>]*>/g, ' ') }).catch(() => {})}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f5f5f3] transition-colors">
              <Share2 className="w-4 h-4"/> Share
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="mt-2 bg-white">
          <div className="px-4 py-3 border-b border-[#f0f0f0]">
            <p className="text-xs font-black text-[#0a0a0a] uppercase tracking-wide">
              {comments.length > 0 ? `${comments.length} Comment${comments.length !== 1 ? 's' : ''}` : 'Be the first to comment'}
            </p>
          </div>
          {!expanded && comments.length > SHOW && (
            <button onClick={() => setExpanded(true)}
              className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-[#1a6b3a] hover:bg-[#f0faf4] w-full border-b border-[#f0f0f0] transition-colors">
              <ChevronDown className="w-3.5 h-3.5"/> View {hidden} more comment{hidden !== 1 ? 's' : ''}
            </button>
          )}
          {visible.map(c => <CommentItem key={c.id} comment={c} myId={myId} postId={post.id} />)}
          {expanded && comments.length > SHOW && (
            <button onClick={() => setExpanded(false)}
              className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-[#aaa] hover:bg-[#f5f5f3] w-full transition-colors">
              <ChevronUp className="w-3.5 h-3.5"/> Show less
            </button>
          )}
        </div>
      </div>

      {/* Comment input */}
      <div className="border-t border-[#e8e8e8] bg-white px-3 py-3 flex items-center gap-2.5 flex-shrink-0">
        <Avatar name={student?.name || ''} size="sm" />
        <div className="flex-1 flex items-center border border-[#e0e0e0] rounded-2xl bg-[#f7f7f5] px-3.5 py-2.5 gap-2 focus-within:border-[#1a6b3a] focus-within:bg-white transition-all">
          <input id="cmt-in" value={commentText} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitComment()}
            placeholder="Write a comment…"
            className="flex-1 text-[12px] outline-none bg-transparent placeholder-[#bbb]"/>
          <button onClick={submitComment} disabled={submitting || !commentText.trim()}
            className="text-[#1a6b3a] disabled:opacity-30 transition-opacity">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, myReaction, onReact, onClick, myId, onEdit, onDelete }: { post:Post; myReaction?:Reaction; myId:string; onReact:(p:Post,r:Reaction)=>void; onClick:()=>void; onEdit:(p:Post)=>void; onDelete:(p:Post)=>void }) {
  const [showPicker, setPicker] = useState(false)
  const [showMenu,   setMenu]   = useState(false)
  const total = post.like_count + post.love_count + post.haha_count + post.wow_count + post.cry_count
  const topR  = REACTIONS.filter(r => (post[`${r.type}_count` as keyof Post] as number) > 0)
    .sort((a, b) => (post[`${b.type}_count` as keyof Post] as number) - (post[`${a.type}_count` as keyof Post] as number))
    .slice(0, 3)
  const myR   = myReaction ? REACTIONS.find(r => r.type === myReaction) : null
  const plain = post.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

  return (
    <div className="bg-white border border-[#efefed] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
      onClick={() => { setPicker(false); setMenu(false); onClick() }}>
      {/* Author row */}
      <div className="flex items-start gap-2.5 px-3.5 pt-3.5 pb-2">
        <Avatar name={post.author} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-[#0a0a0a] text-[13px]">{post.author}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="w-2.5 h-2.5 text-[#bbb]"/>
                <p className="text-[#bbb] text-[10px]">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                <span className="text-[#ddd]">·</span>
                <CatBadge cat={post.category} />
              </div>
            </div>
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setMenu(p => !p)}
                className="p-1.5 rounded-full hover:bg-[#f5f5f3] text-[#bbb] transition-colors">
                <MoreHorizontal className="w-4 h-4"/>
              </button>
              {showMenu && <PostMenu post={post} myId={myId} onEdit={() => onEdit(post)} onDelete={() => onDelete(post)} onClose={() => setMenu(false)}/>}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-3.5 pb-2.5">
        <p className="text-[13px] text-[#222] leading-relaxed line-clamp-3">{plain}</p>
        {plain.length > 160 && <span className="text-[11px] text-[#1a6b3a] font-bold mt-0.5 block">See more</span>}
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="mx-3.5 mb-2.5 rounded-xl overflow-hidden border border-[#e8e8e8] max-h-48">
          <img src={post.image_url} alt="" className="w-full object-cover max-h-48"/>
        </div>
      )}

      {/* Reaction + comment count */}
      {(total > 0 || post.replies > 0) && (
        <div className="flex items-center justify-between px-3.5 py-2 border-t border-[#f5f5f3]">
          <div className="flex items-center gap-1">
            {topR.map(r => <span key={r.type} className="text-sm">{r.emoji}</span>)}
            {total > 0 && <span className="text-[10px] text-[#bbb] ml-0.5 font-medium">{total}</span>}
          </div>
          {post.replies > 0 && (
            <span className="text-[10px] text-[#bbb] font-medium">
              {post.replies} comment{post.replies !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex border-t border-[#f5f5f3]" onClick={e => e.stopPropagation()}>
        <div className="flex-1 relative">
          <button onClick={() => setPicker(p => !p)}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 text-[11px] font-bold hover:bg-[#f5f5f3] transition-colors"
            style={{ color: myR ? myR.color : '#1a6b3a' }}>
            {myR
              ? <><span className="text-base">{myR.emoji}</span><span>{myR.label}</span></>
              : <><ThumbsUp className="w-3.5 h-3.5" strokeWidth={2.5}/><span>Like</span></>}
          </button>
          {showPicker && <ReactionPicker myReaction={myReaction} onReact={r => { setPicker(false); onReact(post, r) }} onClose={() => setPicker(false)}/>}
        </div>
        <button onClick={onClick}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-[#888] hover:bg-[#f5f5f3] border-x border-[#f5f5f3] transition-colors">
          <MessageCircle className="w-3.5 h-3.5"/> Comment
        </button>
        <button onClick={() => navigator.share?.({ text: plain }).catch(() => {})}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-[#888] hover:bg-[#f5f5f3] transition-colors">
          <Share2 className="w-3.5 h-3.5"/> Share
        </button>
      </div>
    </div>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: ()=>void; onCancel: ()=>void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500"/>
          </div>
          <div>
            <p className="font-black text-[#0a0a0a] text-base">Delete Post?</p>
            <p className="text-xs text-[#aaa]">This cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-3 border border-[#e8e8e8] rounded-2xl text-sm font-bold text-[#6b6b6b] hover:bg-[#f5f5f3] transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-2xl text-sm font-bold text-white transition-colors">Delete</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Forum Page ──────────────────────────────────────────────────────────
export default function ForumPage() {
  const { student } = useAuth()
  const [posts,      setPosts]    = useState<Post[]>([])
  const [loading,    setLoading]  = useState(true)
  const [cat,        setCat]      = useState('All')
  const [sort,       setSort]     = useState<'new'|'hot'>('new')
  const [showCreate, setCreate]   = useState(false)
  const [editPost,   setEdit]     = useState<Post|null>(null)
  const [activePost, setActive]   = useState<Post|null>(null)
  const [deletePost, setDelete]   = useState<Post|null>(null)
  const [myReactions,setReactions]= useState<Record<string,Reaction>>({})
  const myId = student?.idNumber || ''

  const loadPosts = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('forum_posts').select('*')
    if (cat !== 'All') q = q.eq('category', cat)
    if (sort === 'hot') q = q.order('replies', { ascending: false })
    else q = q.order('created_at', { ascending: false })
    const { data } = await q
    setPosts((data as Post[]) || [])
    setLoading(false)
  }, [cat, sort])

  useEffect(() => { loadPosts() }, [loadPosts])

  useEffect(() => {
    try { const s = localStorage.getItem('forum_reactions'); if (s) setReactions(JSON.parse(s)) } catch {}
  }, [])

  const handleReact = async (post: Post, reaction: Reaction) => {
    const prev = myReactions[post.id]; const next = { ...myReactions }; const upd: any = {}
    if (prev === reaction) {
      delete next[post.id]; upd[`${reaction}_count`] = Math.max(0, (post[`${reaction}_count` as keyof Post] as number) - 1)
    } else {
      if (prev) upd[`${prev}_count`] = Math.max(0, (post[`${prev}_count` as keyof Post] as number) - 1)
      next[post.id] = reaction; upd[`${reaction}_count`] = ((post[`${reaction}_count` as keyof Post] as number) + 1)
    }
    setReactions(next); localStorage.setItem('forum_reactions', JSON.stringify(next))
    setPosts(p => p.map(x => x.id === post.id ? { ...x, ...upd } : x))
    if (activePost?.id === post.id) setActive(p => p ? { ...p, ...upd } : p)
    await supabase.from('forum_posts').update(upd).eq('id', post.id)
  }

  const handleDelete = async () => {
    if (!deletePost) return
    await supabase.from('forum_posts').delete().eq('id', deletePost.id)
    setDelete(null); loadPosts()
  }

  const av = (student?.name || 'ST').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const totalPosts = posts.length

  return (
    <AppShell>
      <TopBar title="Ask Anything" subtitle="Ask · Share · Connect"/>
      <div className="pb-28">

        {/* Hero composer */}
        <div className="bg-white border-b border-[#e8e8e8] px-4 py-3">
          <div className="flex items-center gap-2.5" onClick={() => setCreate(true)}>
            <Avatar name={student?.name || ''} />
            <div className="flex-1 bg-[#f5f5f3] hover:bg-[#efefed] rounded-2xl px-4 py-2.5 cursor-text transition-colors border border-transparent hover:border-[#e0e0e0]">
              <p className="text-[#aaa] text-[13px]">Ask a question or share something…</p>
            </div>
            <button onClick={e => { e.stopPropagation(); setCreate(true) }}
              className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg,#1a6b3a,#145530)' }}>
              <Pencil className="w-4 h-4"/>
            </button>
          </div>

          {/* Media quick-add */}
          <div className="flex gap-0 mt-2.5 pt-2.5 border-t border-[#f0f0f0]">
            <button onClick={() => setCreate(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold text-[#1a6b3a] hover:bg-[#f0faf4] transition-colors">
              <ImageIcon className="w-3.5 h-3.5"/> Photo
            </button>
            <button onClick={() => setCreate(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold text-[#7c3aed] hover:bg-purple-50 transition-colors">
              <HelpCircle className="w-3.5 h-3.5"/> Question
            </button>
          </div>
        </div>

        {/* Sort + category filter */}
        <div className="bg-white border-b border-[#e8e8e8] sticky top-0 z-10">
          {/* Sort tabs */}
          <div className="flex gap-0 px-4 pt-2">
            {[
              { id:'new' as const,  label:'Latest', icon:Clock },
              { id:'hot' as const,  label:'Popular', icon:Flame },
            ].map(s => (
              <button key={s.id} onClick={() => setSort(s.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-black border-b-2 transition-all ${sort === s.id ? 'border-[#1a6b3a] text-[#1a6b3a]' : 'border-transparent text-[#aaa] hover:text-[#6b6b6b]'}`}>
                <s.icon className="w-3 h-3"/> {s.label}
              </button>
            ))}
            <div className="flex-1"/>
            <span className="self-center text-[10px] text-[#bbb] font-medium">{totalPosts} post{totalPosts !== 1 ? 's' : ''}</span>
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 overflow-x-auto py-2 px-4 scrollbar-hide">
            {CATS.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${cat === c.id ? 'text-white shadow-sm' : 'bg-white border border-[#e8e8e8] text-[#888] hover:border-[#d0d0d0]'}`}
                style={cat === c.id ? { background: c.color } : {}}>
                <c.icon className="w-2.5 h-2.5"/> {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="px-3 py-3 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#f0faf4] flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/>
              </div>
              <p className="text-[11px] text-[#bbb] font-medium">Loading posts…</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <div className="w-16 h-16 rounded-3xl bg-[#f0faf4] flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-[#1a6b3a]"/>
              </div>
              <div>
                <p className="font-black text-[#0a0a0a] text-base">No posts yet</p>
                <p className="text-xs text-[#aaa] mt-1">Be the first to ask a question or start a discussion</p>
              </div>
              <button onClick={() => setCreate(true)}
                className="px-6 py-2.5 rounded-2xl text-white text-xs font-black mt-1"
                style={{ background: 'linear-gradient(135deg,#1a6b3a,#145530)' }}>
                Create First Post
              </button>
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} myReaction={myReactions[post.id]} myId={myId}
                onReact={handleReact} onClick={() => setActive(post)}
                onEdit={p => setEdit(p)} onDelete={p => setDelete(p)}/>
            ))
          )}
        </div>
      </div>

      {/* Floating compose button */}
      {!showCreate && !editPost && !activePost && (
        <button onClick={() => setCreate(true)}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-2xl text-white shadow-2xl flex items-center justify-center z-20 active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg,#1a6b3a,#145530)' }}>
          <Pencil className="w-6 h-6"/>
        </button>
      )}

      {(showCreate || editPost) && (
        <PostEditor editPost={editPost || undefined} onClose={() => { setCreate(false); setEdit(null) }}
          onSaved={() => { setCreate(false); setEdit(null); loadPosts() }}/>
      )}
      {activePost && (
        <PostView post={activePost} myReaction={myReactions[activePost.id]} myId={myId}
          onReact={handleReact} onClose={() => setActive(null)}/>
      )}
      {deletePost && <DeleteConfirm onConfirm={handleDelete} onCancel={() => setDelete(null)}/>}
    </AppShell>
  )
}
