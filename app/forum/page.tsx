'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import {
  ChevronUp, MessageSquare, Plus, X, Send, Loader2,
  MoreHorizontal, Trash2, Flag, ArrowLeft, Search,
  TrendingUp, Clock, AlertTriangle, CheckCircle2, CornerDownRight, User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

/* ── Types ── */
type Post = {
  id: string; title: string; body: string; author: string;
  author_id: string; avatar: string; category: string;
  like_count: number; replies: number; created_at: string; upvoted?: boolean
}
type Comment = {
  id: string; post_id: string; body: string; author: string;
  author_id: string; avatar: string; like_count: number;
  reply_count: number; created_at: string; liked?: boolean
}
type Reply = {
  id: string; comment_id: string; body: string; author: string;
  author_id: string; avatar: string; like_count: number; created_at: string
}
type UserProfile = {
  id: string; id_number: string; name: string; department: string;
  college: string; level: string; avatar_url: string; created_at: string
}

/* ── Constants ── */
const CATS = ['All', 'General', 'Admissions', 'Navigation', 'Accommodation', 'Study Help', 'Registration', 'Campus Life']
const POST_CATS = ['General', 'Admissions', 'Navigation', 'Accommodation', 'Study Help', 'Registration', 'Campus Life']
const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  general:       { bg: '#f3f4f6', text: '#374151' },
  admissions:    { bg: '#dcfce7', text: '#166534' },
  navigation:    { bg: '#dbeafe', text: '#1e40af' },
  accommodation: { bg: '#f3e8ff', text: '#6b21a8' },
  'study help':  { bg: '#fef9c3', text: '#854d0e' },
  registration:  { bg: '#fee2e2', text: '#991b1b' },
  'campus life': { bg: '#e0f2fe', text: '#0c4a6e' },
}

const catStyle = (cat: string) =>
  CAT_COLORS[cat.toLowerCase()] ?? { bg: '#f3f4f6', text: '#374151' }

/* ── Helpers ── */
const notify = (recipientId: string, type: string, title: string, body: string, postId: string, actor: string) => {
  if (!recipientId?.trim() || !recipientId.trim()) return
  supabase.from('notifications').insert({ recipient_id: recipientId, type, title, body, post_id: postId, actor, read: false }).then(() => {})
  fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: recipientId, title, body, url: '/forum' }) }).catch(() => {})
}

const avatar = (name: string, url?: string) => {
  if (url) return <img src={url} alt={name} className="w-full h-full object-cover rounded-full" />
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'AN'
  const colors = ['#1a6b3a', '#2563eb', '#7c3aed', '#d97706', '#e11d48', '#0891b2']
  const color = colors[initials.charCodeAt(0) % colors.length]
  return <span className="text-white text-[10px] font-bold" style={{ textShadow: 'none' }}>{initials}</span>
}

const avatarBg = (name: string) => {
  const colors = ['#1a6b3a', '#2563eb', '#7c3aed', '#d97706', '#e11d48', '#0891b2']
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'AN'
  return colors[initials.charCodeAt(0) % colors.length]
}

/* ── Avatar Circle ── */
function Avatar({ name, url, size = 8 }: { name: string; url?: string; size?: number }) {
  const bg = avatarBg(name)
  const sz = `w-${size} h-${size}`
  return (
    <div className={`${sz} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden`} style={{ background: bg }}>
      {url ? <img src={url} alt={name} className="w-full h-full object-cover" /> : (
        <span className="text-white font-bold" style={{ fontSize: size * 1.5 }}>
          {name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'AN'}
        </span>
      )}
    </div>
  )
}

/* ── Report Modal ── */
function ReportModal({ postId, postTitle, reporter, onClose, onDone }: {
  postId: string; postTitle: string; reporter: string; onClose: () => void; onDone: () => void
}) {
  const [reason, setReason] = useState('spam')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const REASONS = ['spam', 'harassment', 'misinformation', 'inappropriate', 'off-topic', 'other']

  const submit = async () => {
    setSubmitting(true)
    await supabase.from('forum_reports').insert({
      post_id: postId, reporter_id: reporter, reason, details: details.trim(), status: 'pending'
    })
    // notify admin
    await supabase.from('admin_notifications').insert({
      type: 'report', title: 'Post Reported',
      body: `"${postTitle}" was reported for: ${reason}`,
      data: { post_id: postId, reporter, reason }
    })
    setSubmitting(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="font-bold text-[#0a0a0a]">Report Post</h3>
          <button onClick={onClose} className="ml-auto"><X className="w-5 h-5 text-[#6b6b6b]" /></button>
        </div>
        <p className="text-xs text-[#6b6b6b] mb-4 leading-relaxed line-clamp-2">{postTitle}</p>
        <div className="space-y-2 mb-4">
          {REASONS.map(r => (
            <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${reason === r ? 'border-red-400 bg-red-50' : 'border-[#e8e8e8]'}`}>
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-red-500" />
              <span className="text-sm font-medium text-[#0a0a0a] capitalize">{r}</span>
            </label>
          ))}
        </div>
        <textarea
          value={details} onChange={e => setDetails(e.target.value)}
          placeholder="Additional details (optional)..."
          className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm resize-none outline-none focus:border-red-400 mb-4"
          rows={2}
        />
        <button onClick={submit} disabled={submitting}
          className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit Report
        </button>
      </div>
    </div>
  )
}

/* ── User Profile Modal ── */
function UserProfileModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase.from('students').select('*').eq('id_number', userId).single(),
      supabase.from('forum_posts').select('id,title,category,like_count,replies,created_at').eq('author_id', userId).order('created_at', { ascending: false }).limit(5)
    ]).then(([{ data: p }, { data: fp }]) => {
      setProfile(p as UserProfile)
      setPosts((fp as Post[]) || [])
      setLoading(false)
    })
  }, [userId])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin" /></div>
        ) : !profile ? (
          <div className="p-6 text-center"><p className="text-[#6b6b6b] text-sm">Profile not found</p></div>
        ) : (
          <div>
            <div className="bg-[#1a6b3a] p-5 rounded-t-2xl relative">
              <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 flex items-center justify-center" style={{ background: avatarBg(profile.name || 'U') }}>
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                    : <span className="text-white text-2xl font-bold">{(profile.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('')}</span>
                  }
                </div>
                <div>
                  <h2 className="text-white font-black text-lg">{profile.name || 'Anonymous'}</h2>
                  <p className="text-white/60 text-xs font-mono">{profile.id_number}</p>
                  <p className="text-white/50 text-xs mt-1">Member since {new Date(profile.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Department', value: profile.department || 'N/A' },
                  { label: 'College', value: profile.college || 'N/A' },
                  { label: 'Level', value: profile.level ? `${profile.level}L` : 'N/A' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#f9f9f7] rounded-xl p-3 text-center">
                    <p className="text-[9px] font-bold text-[#aaa] uppercase tracking-wide">{label}</p>
                    <p className="text-xs font-bold text-[#0a0a0a] mt-1 truncate">{value}</p>
                  </div>
                ))}
              </div>
              {posts.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-3">Recent Posts</p>
                  <div className="space-y-2">
                    {posts.map(p => {
                      const cs = catStyle(p.category)
                      return (
                        <div key={p.id} className="flex items-start gap-2 p-3 bg-[#f9f9f7] rounded-xl">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#0a0a0a] text-xs leading-snug truncate">{p.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: cs.bg, color: cs.text }}>{p.category}</span>
                              <span className="text-[9px] text-[#aaa]">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[#aaa]">
                            <MessageSquare className="w-3 h-3" />
                            <span className="text-[9px]">{p.replies}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Thread Detail ── */
function ThreadDetail({ post, myId, myName, myAvatar, onClose, onDeleted }: {
  post: Post; myId: string; myName: string; myAvatar: string;
  onClose: () => void; onDeleted: () => void
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [replies, setReplies] = useState<Record<string, Reply[]>>({})
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set())
  const [showReport, setShowReport] = useState(false)
  const [reported, setReported] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [upvoted, setUpvoted] = useState(post.upvoted ?? false)
  const [voteCount, setVoteCount] = useState(post.like_count)
  const [menuOpen, setMenuOpen] = useState(false)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  const loadComments = useCallback(async () => {
    const { data } = await supabase.from('forum_comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true })
    const myLikes = await supabase.from('forum_comment_likes').select('comment_id').eq('student_id', myId)
    const likedSet = new Set((myLikes.data || []).map((l: any) => l.comment_id))
    setComments((data || []).map((c: Comment) => ({ ...c, liked: likedSet.has(c.id) })))
    setLoading(false)
  }, [post.id, myId])

  useEffect(() => { loadComments() }, [loadComments])

  // Check if already upvoted
  useEffect(() => {
    supabase.from('forum_post_likes').select('id').eq('post_id', post.id).eq('student_id', myId).single()
      .then(({ data }) => { if (data) setUpvoted(true) })
  }, [post.id, myId])

  const handleVote = async () => {
    if (upvoted) {
      setUpvoted(false); setVoteCount(v => v - 1)
      await supabase.from('forum_post_likes').delete().match({ post_id: post.id, student_id: myId })
      await supabase.from('forum_posts').update({ like_count: voteCount - 1 }).eq('id', post.id)
    } else {
      setUpvoted(true); setVoteCount(v => v + 1)
      await supabase.from('forum_post_likes').upsert({ post_id: post.id, student_id: myId })
      await supabase.from('forum_posts').update({ like_count: voteCount + 1 }).eq('id', post.id)
      if (post.author_id !== myId) notify(post.author_id, 'reaction', 'Someone upvoted your post', `${myName} upvoted: "${post.title}"`, post.id, myName)
    }
  }

  const submitComment = async () => {
    if (!body.trim()) return
    setSending(true)
    const { data } = await supabase.from('forum_comments').insert({
      post_id: post.id, body: body.trim(), author: myName, avatar: myAvatar, author_id: myId, like_count: 0, reply_count: 0
    }).select().single()
    await supabase.from('forum_posts').update({ replies: (comments.length + 1) }).eq('id', post.id)
    if (post.author_id !== myId) notify(post.author_id, 'comment', 'New reply on your post', `${myName} replied: "${body.trim().slice(0, 60)}"`, post.id, myName)
    setBody('')
    setSending(false)
    loadComments()
  }

  const submitReply = async () => {
    if (!replyBody.trim() || !replyTo) return
    setSendingReply(true)
    await supabase.from('forum_comment_replies').insert({
      comment_id: replyTo.id, post_id: post.id, body: replyBody.trim(), author: myName, avatar: myAvatar, author_id: myId
    })
    await supabase.from('forum_comments').update({ reply_count: (replyTo.reply_count || 0) + 1 }).eq('id', replyTo.id)
    if (replyTo.author_id !== myId) notify(replyTo.author_id, 'reply', 'Someone replied to your comment', `${myName}: "${replyBody.trim().slice(0, 60)}"`, post.id, myName)
    setReplyBody(''); setReplyTo(null); setSendingReply(false)
    loadReplies(replyTo.id)
  }

  const loadReplies = async (commentId: string) => {
    setLoadingReplies(prev => new Set(prev).add(commentId))
    const { data } = await supabase.from('forum_comment_replies').select('*').eq('comment_id', commentId).order('created_at', { ascending: true })
    setReplies(prev => ({ ...prev, [commentId]: (data as Reply[]) || [] }))
    setExpandedReplies(prev => new Set(prev).add(commentId))
    setLoadingReplies(prev => { const s = new Set(prev); s.delete(commentId); return s })
  }

  const likeComment = async (c: Comment) => {
    if (c.liked) {
      setComments(prev => prev.map(x => x.id === c.id ? { ...x, liked: false, like_count: x.like_count - 1 } : x))
      await supabase.from('forum_comment_likes').delete().match({ comment_id: c.id, student_id: myId })
      await supabase.from('forum_comments').update({ like_count: c.like_count - 1 }).eq('id', c.id)
    } else {
      setComments(prev => prev.map(x => x.id === c.id ? { ...x, liked: true, like_count: x.like_count + 1 } : x))
      await supabase.from('forum_comment_likes').upsert({ comment_id: c.id, student_id: myId })
      await supabase.from('forum_comments').update({ like_count: c.like_count + 1 }).eq('id', c.id)
      if (c.author_id !== myId) notify(c.author_id, 'reaction', 'Someone liked your comment', `${myName} liked your comment`, post.id, myName)
    }
  }

  const deletePost = async () => {
    if (!confirm('Delete this post?')) return
    await supabase.from('forum_posts').delete().eq('id', post.id)
    onDeleted()
  }

  const cs = catStyle(post.category)

  return (
    <div className="fixed inset-0 bg-[#f9f9f7] z-40 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#e8e8e8] flex-shrink-0">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f0f0f0]">
          <ArrowLeft className="w-5 h-5 text-[#0a0a0a]" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#0a0a0a] truncate">{post.title}</p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: cs.bg, color: cs.text }}>{post.category}</span>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f0f0f0]">
            <MoreHorizontal className="w-4 h-4 text-[#6b6b6b]" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-[#e8e8e8] rounded-2xl shadow-xl z-50 overflow-hidden">
              {post.author_id === myId ? (
                <button onClick={() => { setMenuOpen(false); deletePost() }} className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" /> Delete post
                </button>
              ) : (
                <button onClick={() => { setMenuOpen(false); setShowReport(true) }} className="flex items-center gap-2 w-full px-4 py-3 text-sm text-[#6b6b6b] hover:bg-[#f9f9f7]">
                  <Flag className="w-3.5 h-3.5" /> Report post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Post body */}
        <div className="bg-white p-4 mb-2">
          <h1 className="font-black text-[#0a0a0a] text-base leading-snug mb-3">{post.title}</h1>
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setProfileId(post.author_id)} className="flex items-center gap-2">
              <Avatar name={post.author} url={post.avatar} size={6} />
              <span className="text-xs font-semibold text-[#1a6b3a] hover:underline">{post.author}</span>
            </button>
            <span className="text-[#ddd]">·</span>
            <span className="text-[10px] text-[#aaa]">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
          </div>
          {post.body && (
            <div className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap mb-4">{post.body}</div>
          )}
          <div className="flex items-center gap-4 pt-3 border-t border-[#f0f0f0]">
            <button onClick={handleVote}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${upvoted ? 'bg-[#1a6b3a] text-white' : 'bg-[#f9f9f7] text-[#6b6b6b] hover:bg-[#1a6b3a]/10 hover:text-[#1a6b3a]'}`}>
              <ChevronUp className="w-3.5 h-3.5" />
              {voteCount} {voteCount === 1 ? 'upvote' : 'upvotes'}
            </button>
            <div className="flex items-center gap-1.5 text-[#aaa]">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-xs">{comments.length} {comments.length === 1 ? 'reply' : 'replies'}</span>
            </div>
          </div>
        </div>

        {/* Comments */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin" /></div>
        ) : (
          <div className="px-0">
            {comments.length === 0 && (
              <div className="py-10 text-center">
                <MessageSquare className="w-8 h-8 text-[#ddd] mx-auto mb-2" />
                <p className="text-sm text-[#aaa]">No replies yet. Be the first!</p>
              </div>
            )}
            {comments.map(c => (
              <div key={c.id} className="bg-white mb-px px-4 py-3">
                <div className="flex gap-3">
                  <button onClick={() => setProfileId(c.author_id)} className="flex-shrink-0 mt-0.5">
                    <Avatar name={c.author} url={c.avatar} size={7} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button onClick={() => setProfileId(c.author_id)}
                        className="text-xs font-bold text-[#1a6b3a] hover:underline">{c.author}</button>
                      <span className="text-[10px] text-[#aaa]">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">{c.body}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => likeComment(c)}
                        className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${c.liked ? 'text-[#1a6b3a]' : 'text-[#aaa] hover:text-[#1a6b3a]'}`}>
                        <ChevronUp className="w-3 h-3" /> {c.like_count}
                      </button>
                      <button onClick={() => { setReplyTo(c); setTimeout(() => commentRef.current?.focus(), 100) }}
                        className="text-[10px] font-bold text-[#aaa] hover:text-[#1a6b3a] transition-colors flex items-center gap-1">
                        <CornerDownRight className="w-3 h-3" /> Reply
                      </button>
                      {(c.reply_count > 0 || (replies[c.id]?.length ?? 0) > 0) && (
                        <button onClick={() => expandedReplies.has(c.id)
                          ? setExpandedReplies(prev => { const s = new Set(prev); s.delete(c.id); return s })
                          : loadReplies(c.id)}
                          className="text-[10px] font-bold text-[#2563eb] hover:text-[#1d4ed8] transition-colors">
                          {expandedReplies.has(c.id) ? 'Hide' : `View ${c.reply_count} ${c.reply_count === 1 ? 'reply' : 'replies'}`}
                        </button>
                      )}
                    </div>
                    {/* Replies */}
                    {loadingReplies.has(c.id) && <div className="mt-2"><Loader2 className="w-3 h-3 animate-spin text-[#aaa]" /></div>}
                    {expandedReplies.has(c.id) && replies[c.id]?.map(r => (
                      <div key={r.id} className="mt-3 ml-2 pl-3 border-l-2 border-[#f0f0f0] flex gap-2">
                        <button onClick={() => setProfileId(r.author_id)}><Avatar name={r.author} url={r.avatar} size={6} /></button>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <button onClick={() => setProfileId(r.author_id)} className="text-[10px] font-bold text-[#1a6b3a] hover:underline">{r.author}</button>
                            <span className="text-[9px] text-[#aaa]">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                          </div>
                          <p className="text-xs text-[#374151] leading-relaxed">{r.body}</p>
                        </div>
                      </div>
                    ))}
                    {/* Reply input */}
                    {replyTo?.id === c.id && (
                      <div className="mt-3 ml-2 pl-3 border-l-2 border-[#1a6b3a]/30">
                        <p className="text-[9px] text-[#1a6b3a] font-bold mb-1">Replying to {c.author}</p>
                        <div className="flex gap-2 items-center">
                          <input ref={commentRef as any} value={replyBody} onChange={e => setReplyBody(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 border border-[#e8e8e8] rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#1a6b3a]"
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitReply())} />
                          <button onClick={() => setReplyTo(null)} className="text-[#aaa] hover:text-[#6b6b6b]"><X className="w-3.5 h-3.5" /></button>
                          <button onClick={submitReply} disabled={sendingReply || !replyBody.trim()}
                            className="w-6 h-6 bg-[#1a6b3a] rounded-full flex items-center justify-center disabled:opacity-40">
                            {sendingReply ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Send className="w-3 h-3 text-white" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="h-24" />
          </div>
        )}
      </div>

      {/* Comment input */}
      <div className="bg-white border-t border-[#e8e8e8] p-3 flex gap-3 items-end flex-shrink-0">
        <Avatar name={myName} size={8} />
        <div className="flex-1 flex items-end border border-[#e8e8e8] rounded-2xl overflow-hidden focus-within:border-[#1a6b3a] transition-colors">
          <textarea ref={commentRef} value={body} onChange={e => setBody(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 px-3 py-2 text-sm resize-none outline-none min-h-[36px] max-h-24"
            rows={1}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }} />
          <button onClick={submitComment} disabled={sending || !body.trim()}
            className="p-2 m-1 bg-[#1a6b3a] rounded-xl disabled:opacity-40 flex-shrink-0">
            {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {showReport && !reported && (
        <ReportModal postId={post.id} postTitle={post.title} reporter={myId} onClose={() => setShowReport(false)}
          onDone={() => { setShowReport(false); setReported(true) }} />
      )}
      {reported && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#0a0a0a] text-white text-xs px-4 py-2 rounded-full flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]" /> Post reported. Thank you.
        </div>
      )}
      {profileId && <UserProfileModal userId={profileId} onClose={() => setProfileId(null)} />}
    </div>
  )
}

/* ── New Post Modal ── */
function NewPostModal({ myName, myAvatar, myId, onClose, onPosted }: {
  myName: string; myAvatar: string; myId: string; onClose: () => void; onPosted: () => void
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('General')
  const [posting, setPosting] = useState(false)

  const submit = async () => {
    if (!title.trim()) return
    setPosting(true)
    await supabase.from('forum_posts').insert({
      title: title.trim(), body: body.trim(), author: myName,
      avatar: myAvatar, author_id: myId, category, like_count: 0, replies: 0
    })
    // Admin notification
    await supabase.from('admin_notifications').insert({
      type: 'new_post', title: 'New Forum Post',
      body: `${myName} posted: "${title.trim()}"`,
      data: { author_id: myId, category }
    })
    setPosting(false)
    onPosted()
  }

  return (
    <div className="fixed inset-0 bg-[#f9f9f7] z-40 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#e8e8e8]">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f0f0f0]">
          <X className="w-5 h-5 text-[#0a0a0a]" />
        </button>
        <span className="font-bold text-[#0a0a0a] flex-1">New Thread</span>
        <button onClick={submit} disabled={posting || !title.trim()}
          className="px-4 py-1.5 bg-[#1a6b3a] text-white rounded-full text-sm font-bold disabled:opacity-40 flex items-center gap-1.5">
          {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Post
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={myName} size={9} />
          <div>
            <p className="font-bold text-[#0a0a0a] text-sm">{myName}</p>
            <p className="text-[10px] text-[#aaa]">Posting to community</p>
          </div>
        </div>
        {/* Category */}
        <div>
          <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-2">Category</p>
          <div className="flex flex-wrap gap-2">
            {POST_CATS.map(c => {
              const cs = catStyle(c)
              return (
                <button key={c} onClick={() => setCategory(c)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                  style={category === c ? { background: cs.bg, color: cs.text, borderColor: cs.text } : { background: 'white', color: '#6b6b6b', borderColor: '#e8e8e8' }}>
                  {c}
                </button>
              )
            })}
          </div>
        </div>
        {/* Title */}
        <div>
          <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-2">Title *</p>
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200}
            placeholder="What's your question or topic?"
            className="w-full border-2 border-[#e8e8e8] rounded-2xl px-4 py-3 text-sm font-semibold text-[#0a0a0a] outline-none focus:border-[#1a6b3a] transition-colors" />
          <p className="text-[9px] text-[#aaa] mt-1 text-right">{title.length}/200</p>
        </div>
        {/* Body */}
        <div>
          <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-2">Details (optional)</p>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={5}
            placeholder="Add more context, details, or description..."
            className="w-full border-2 border-[#e8e8e8] rounded-2xl px-4 py-3 text-sm text-[#374151] outline-none focus:border-[#1a6b3a] transition-colors resize-none" />
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function ForumPage() {
  const { student } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('All')
  const [sort, setSort] = useState<'latest' | 'top'>('latest')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [activePosts, setActivePost] = useState<Post | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)

  const myId = student?.idNumber || ''
  const myName = student?.name || 'Student'
  const myAvatar = ''

  const loadPosts = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('forum_posts').select('*')
    if (cat !== 'All') q = q.eq('category', cat)
    if (sort === 'top') q = q.order('like_count', { ascending: false })
    else q = q.order('created_at', { ascending: false })
    const { data } = await q
    const myLikes = await supabase.from('forum_post_likes').select('post_id').eq('student_id', myId)
    const likedSet = new Set((myLikes.data || []).map((l: any) => l.post_id))
    setPosts(((data as Post[]) || []).map(p => ({ ...p, upvoted: likedSet.has(p.id) })))
    setLoading(false)
  }, [cat, sort, myId])

  useEffect(() => { loadPosts() }, [loadPosts])

  const filtered = search
    ? posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.body.toLowerCase().includes(search.toLowerCase()))
    : posts

  return (
    <AppShell>
      <TopBar title="Community Forum" subtitle="Ask questions, share knowledge" />

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 bg-white border-b border-[#e8e8e8]">
          <div className="flex items-center gap-2 bg-[#f9f9f7] rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-[#aaa]" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search threads..." className="flex-1 text-sm outline-none bg-transparent" />
            {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-[#aaa]" /></button>}
          </div>
        </div>
      )}

      <div className="w-full pb-28">
        {/* Category tabs */}
        <div className="flex gap-1.5 px-4 pt-4 pb-2 overflow-x-auto no-scrollbar">
          {CATS.map(c => {
            const cs = catStyle(c)
            return (
              <button key={c} onClick={() => setCat(c)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border-2"
                style={cat === c
                  ? { background: c === 'All' ? '#0a0a0a' : cs.bg, color: c === 'All' ? 'white' : cs.text, borderColor: c === 'All' ? '#0a0a0a' : cs.text }
                  : { background: 'white', color: '#6b6b6b', borderColor: '#e8e8e8' }}>
                {c}
              </button>
            )
          })}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#e8e8e8]">
          {[
            { key: 'latest' as const, icon: <Clock className="w-3 h-3" />, label: 'Latest' },
            { key: 'top' as const, icon: <TrendingUp className="w-3 h-3" />, label: 'Top' },
          ].map(s => (
            <button key={s.key} onClick={() => setSort(s.key)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${sort === s.key ? 'bg-[#0a0a0a] text-white' : 'text-[#6b6b6b] hover:bg-[#f0f0f0]'}`}>
              {s.icon} {s.label}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-[#aaa]">{filtered.length} thread{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Thread list */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-10 h-10 text-[#e8e8e8] mx-auto mb-3" />
            <p className="font-bold text-[#0a0a0a] text-sm">No threads yet</p>
            <p className="text-[#aaa] text-xs mt-1">Be the first to start a discussion!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0f0f0]">
            {filtered.map(p => {
              const cs = catStyle(p.category)
              return (
                <div key={p.id} className="bg-white hover:bg-[#fafafa] transition-colors">
                  <div className="flex gap-0">
                    {/* Vote column */}
                    <div className="flex flex-col items-center pt-4 px-3 w-14 flex-shrink-0">
                      <ChevronUp className={`w-4 h-4 ${p.upvoted ? 'text-[#1a6b3a]' : 'text-[#ccc]'}`} />
                      <span className={`text-xs font-black leading-tight ${p.upvoted ? 'text-[#1a6b3a]' : 'text-[#aaa]'}`}>{p.like_count}</span>
                    </div>
                    {/* Content */}
                    <button onClick={() => setActivePost(p)} className="flex-1 py-3 pr-4 text-left min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: cs.bg, color: cs.text }}>
                          {p.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-[#0a0a0a] text-sm leading-snug mb-2 line-clamp-2">{p.title}</h3>
                      {p.body && <p className="text-[#6b6b6b] text-xs leading-relaxed line-clamp-1 mb-2">{p.body}</p>}
                      <div className="flex items-center gap-2">
                        <button onClick={e => { e.stopPropagation(); setProfileId(p.author_id) }}
                          className="flex items-center gap-1.5 group">
                          <Avatar name={p.author} size={4} />
                          <span className="text-[10px] font-semibold text-[#1a6b3a] group-hover:underline">{p.author}</span>
                        </button>
                        <span className="text-[#ddd] text-[10px]">·</span>
                        <span className="text-[10px] text-[#aaa]">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                        <span className="text-[#ddd] text-[10px]">·</span>
                        <span className="flex items-center gap-0.5 text-[10px] text-[#aaa]">
                          <MessageSquare className="w-2.5 h-2.5" /> {p.replies}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowNew(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#1a6b3a] rounded-2xl shadow-lg flex items-center justify-center z-30 active:scale-95 transition-transform">
        <Plus className="w-6 h-6 text-white" />
      </button>

      {activePosts && (
        <ThreadDetail
          post={activePosts}
          myId={myId} myName={myName} myAvatar={myAvatar}
          onClose={() => setActivePost(null)}
          onDeleted={() => { setActivePost(null); loadPosts() }}
        />
      )}
      {showNew && (
        <NewPostModal
          myName={myName} myAvatar={myAvatar} myId={myId}
          onClose={() => setShowNew(false)}
          onPosted={() => { setShowNew(false); loadPosts() }}
        />
      )}
      {profileId && <UserProfileModal userId={profileId} onClose={() => setProfileId(null)} />}
    </AppShell>
  )
}
