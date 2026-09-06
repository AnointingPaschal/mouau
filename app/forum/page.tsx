'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import {
  X, Send, MessageCircle, Share2, Loader2, MoreHorizontal,
  Image as ImageIcon, Video, Bold, Italic, Underline,
  List, Link, AlignLeft, ThumbsUp, Heart, Laugh, Frown, Zap,
  ArrowLeft, ChevronDown
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Reaction = 'like'|'love'|'haha'|'wow'|'cry'
type Post = {
  id:string; title:string; body:string; author:string; avatar:string
  category:string; image_url:string; video_url:string
  like_count:number; love_count:number; haha_count:number; wow_count:number; cry_count:number
  replies:number; views:number; tags:string[]; created_at:string
}
type Comment = { id:string; post_id:string; author:string; avatar:string; body:string; image_url:string; created_at:string }

const REACTIONS:{type:Reaction;emoji:string;label:string;color:string}[] = [
  {type:'like',  emoji:'👍', label:'Like',  color:'#1a6b3a'},
  {type:'love',  emoji:'❤️', label:'Love',  color:'#e11d48'},
  {type:'haha',  emoji:'😂', label:'Haha',  color:'#d97706'},
  {type:'wow',   emoji:'😮', label:'Wow',   color:'#7c3aed'},
  {type:'cry',   emoji:'😢', label:'Cry',   color:'#2563eb'},
]
const CATS = ['All','Admissions','Navigation','Accommodation','Study Help','Registration','Campus Life','General']
const POST_CATS = ['General','Admissions','Navigation','Accommodation','Study Help','Registration','Campus Life']

// ─── Rich Text Toolbar ────────────────────────────────────────────────────────
function RichToolbar({ editorRef }:{ editorRef:React.RefObject<HTMLDivElement> }) {
  const exec = (cmd:string, val?:string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
  }
  const tools = [
    { icon:<Bold className="w-4 h-4"/>,      cmd:'bold',                 title:'Bold' },
    { icon:<Italic className="w-4 h-4"/>,    cmd:'italic',               title:'Italic' },
    { icon:<Underline className="w-4 h-4"/>, cmd:'underline',            title:'Underline' },
    { icon:<List className="w-4 h-4"/>,      cmd:'insertUnorderedList',  title:'List' },
    { icon:<AlignLeft className="w-4 h-4"/>, cmd:'insertOrderedList',    title:'Numbered' },
  ]
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-t border-[#e8e8e8]">
      {tools.map(t => (
        <button key={t.cmd} onMouseDown={e => { e.preventDefault(); exec(t.cmd) }}
          title={t.title}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#f0f0f0] text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors">
          {t.icon}
        </button>
      ))}
      <div className="w-px h-5 bg-[#e8e8e8] mx-1"/>
      <button onMouseDown={e => { e.preventDefault(); const url=prompt('Enter URL:'); if(url) exec('createLink',url) }}
        title="Link" className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#f0f0f0] text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors">
        <Link className="w-4 h-4"/>
      </button>
    </div>
  )
}

// ─── Full-Page Post Creator (Facebook-style) ───────────────────────────────────
function PostCreator({ onClose, onPosted }:{ onClose:()=>void; onPosted:()=>void }) {
  const { student } = useAuth()
  const [postCat, setPostCat]       = useState('General')
  const [postFile, setPostFile]     = useState<File|null>(null)
  const [postPreview, setPostPreview] = useState<string|null>(null)
  const [isVideo, setIsVideo]       = useState(false)
  const [posting, setPosting]       = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)
  const av = (student?.name||'ST').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)

  // Handle hardware back button
  useEffect(() => {
    const onPop = () => onClose()
    window.history.pushState({ modal:'create-post' }, '')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  },[onClose])

  const handleFileChange = (e:React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if(!f) return
    setPostFile(f); setIsVideo(f.type.startsWith('video/'))
    setPostPreview(URL.createObjectURL(f))
  }

  const submitPost = async() => {
    const body = editorRef.current?.innerHTML||''
    if(!body.replace(/<[^>]*>/g,'').trim()) return
    setPosting(true)
    let mediaUrl=''
    if(postFile){
      const ext=postFile.name.split('.').pop()
      const path=`forum/${Date.now()}.${ext}`
      const {error} = await supabase.storage.from('materials').upload(path,postFile,{contentType:postFile.type})
      if(!error){
        const {data:{publicUrl}} = supabase.storage.from('materials').getPublicUrl(path)
        mediaUrl=publicUrl
      }
    }
    await supabase.from('forum_posts').insert({
      title:body.replace(/<[^>]*>/g,' ').trim().slice(0,100),
      body, author:student?.name||'Anonymous', avatar:av,
      category:postCat, tags:[],
      image_url:isVideo?'':mediaUrl, video_url:isVideo?mediaUrl:'',
      replies:0, views:0, likes:0,
      like_count:0, love_count:0, haha_count:0, wow_count:0, cry_count:0,
    })
    setPosting(false)
    onPosted()
  }

  const hasContent = () => (editorRef.current?.textContent||'').trim().length > 0

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e8e8] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#f0f0f0] transition-colors">
            <X className="w-5 h-5 text-[#0a0a0a]"/>
          </button>
          <h2 className="font-black text-[#0a0a0a] text-lg">Create Post</h2>
        </div>
        <button onClick={submitPost} disabled={posting}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${posting ? 'bg-[#1a6b3a]/40 text-white cursor-not-allowed' : 'bg-[#1a6b3a] text-white hover:bg-[#145530] active:scale-95'}`}>
          {posting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Post'}
        </button>
      </div>

      {/* Author row */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
        <div className="w-11 h-11 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-base">{av}</div>
        <div>
          <p className="font-bold text-[#0a0a0a] text-base">{student?.name}</p>
          <button className="flex items-center gap-1 mt-0.5 bg-[#f0f0f0] hover:bg-[#e8e8e8] rounded-lg px-2.5 py-1 transition-colors">
            <select value={postCat} onChange={e=>setPostCat(e.target.value)}
              className="text-xs font-semibold text-[#0a0a0a] bg-transparent outline-none cursor-pointer appearance-none pr-1">
              {POST_CATS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="w-3 h-3 text-[#6b6b6b]"/>
          </button>
        </div>
      </div>

      {/* Editor — takes remaining space */}
      <div className="flex-1 overflow-y-auto px-4">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={`What's on your mind, ${student?.name?.split(' ')[0]}?`}
          className="min-h-full text-[17px] text-[#0a0a0a] outline-none leading-relaxed pb-20 empty:before:content-[attr(data-placeholder)] empty:before:text-[#aaa] empty:before:pointer-events-none"
        />

        {/* Media preview */}
        {postPreview && (
          <div className="relative rounded-xl overflow-hidden border border-[#e8e8e8] mb-4">
            {isVideo
              ? <video src={postPreview} className="w-full max-h-64 object-contain bg-black" controls/>
              : <img src={postPreview} alt="Preview" className="w-full max-h-64 object-cover"/>}
            <button onClick={()=>{ setPostFile(null); setPostPreview(null) }}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5">
              <X className="w-4 h-4"/>
            </button>
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="flex-shrink-0 border-t border-[#e8e8e8] bg-white">
        <RichToolbar editorRef={editorRef}/>
        <div className="flex items-center gap-1 px-4 py-3 border-t border-[#e8e8e8]">
          <span className="text-xs font-semibold text-[#6b6b6b] mr-2">Add to post</span>
          <button onClick={()=>fileRef.current?.click()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f0f0f0] transition-colors">
            <ImageIcon className="w-5 h-5 text-[#1a6b3a]"/>
          </button>
          <button onClick={()=>fileRef.current?.click()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f0f0f0] transition-colors">
            <Video className="w-5 h-5 text-red-500"/>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange}/>
      </div>
    </div>
  )
}

// ─── Full Post View ────────────────────────────────────────────────────────────
function PostView({ post, myReaction, onReact, onClose }:{
  post:Post; myReaction?:Reaction
  onReact:(post:Post,r:Reaction)=>void
  onClose:()=>void
}) {
  const { student } = useAuth()
  const [comments, setComments]   = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [showPicker, setShowPicker]   = useState(false)
  const av = (student?.name||'ST').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)

  // Handle hardware back button
  useEffect(()=>{
    const onPop = () => onClose()
    window.history.pushState({ modal:'post-view' }, '')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  },[onClose])

  useEffect(()=>{
    supabase.from('forum_comments').select('*').eq('post_id',post.id).order('created_at')
      .then(({data})=>{ if(data) setComments(data as Comment[]) })
  },[post.id])

  const submitComment = async() => {
    if(!commentText.trim()||submitting) return
    setSubmitting(true)
    await supabase.from('forum_comments').insert({
      post_id:post.id, author:student?.name||'Anonymous', avatar:av, body:commentText.trim()
    })
    await supabase.from('forum_posts').update({replies:(post.replies||0)+1}).eq('id',post.id)
    setCommentText('')
    const {data} = await supabase.from('forum_comments').select('*').eq('post_id',post.id).order('created_at')
    if(data) setComments(data as Comment[])
    setSubmitting(false)
  }

  const myR = myReaction ? REACTIONS.find(r=>r.type===myReaction) : null
  const total = post.like_count+post.love_count+post.haha_count+post.wow_count+post.cry_count
  const topR  = REACTIONS.filter(r=>(post[`${r.type}_count` as keyof Post] as number)>0)
    .sort((a,b)=>(post[`${b.type}_count` as keyof Post] as number)-(post[`${a.type}_count` as keyof Post] as number)).slice(0,3)

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e8e8e8] flex-shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#f0f0f0]">
          <ArrowLeft className="w-5 h-5 text-[#0a0a0a]"/>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-black text-[#0a0a0a] text-sm">{post.author}</p>
          <p className="text-[10px] text-[#aaa]">{formatDistanceToNow(new Date(post.created_at),{addSuffix:true})}</p>
        </div>
        <span className="badge badge-green text-[9px]">{post.category}</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 bg-[#1a6b3a] rounded-full flex items-center justify-center text-white font-bold">{post.avatar}</div>
            <div>
              <p className="font-bold text-[#0a0a0a] text-sm">{post.author}</p>
              <p className="text-[10px] text-[#aaa]">{formatDistanceToNow(new Date(post.created_at),{addSuffix:true})}</p>
            </div>
          </div>
          <div className="text-sm text-[#0a0a0a] leading-relaxed"
            dangerouslySetInnerHTML={{__html: post.body.replace(/\n/g,'<br/>')}}/>
          {post.image_url && <img src={post.image_url} alt="Post" className="w-full rounded-xl mt-3 object-cover max-h-80"/>}
          {post.video_url && <video src={post.video_url} controls className="w-full mt-3 rounded-xl bg-black max-h-64"/>}
        </div>

        {/* Reaction summary */}
        {(total>0||post.replies>0) && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-[#f0f0f0]">
            <div className="flex items-center gap-1">
              {topR.map(r=><span key={r.type} className="text-sm">{r.emoji}</span>)}
              {total>0&&<span className="text-[11px] text-[#aaa] ml-1">{total}</span>}
            </div>
            {post.replies>0&&<span className="text-[11px] text-[#aaa]">{post.replies} comment{post.replies!==1?'s':''}</span>}
          </div>
        )}

        {/* Action bar */}
        <div className="flex border-t border-[#f0f0f0]">
          <div className="flex-1 relative">
            <button onClick={()=>setShowPicker(p=>!p)}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-semibold hover:bg-[#f9f9f7] transition-all"
              style={{color: myR ? myR.color : '#1a6b3a'}}>
              {myR ? (
                <><span className="text-base leading-none">{myR.emoji}</span><span>{myR.label}</span></>
              ) : (
                <><ThumbsUp className="w-4 h-4" fill={myReaction?'#1a6b3a':'none'}/><span>Like</span></>
              )}
            </button>
            {showPicker && (
              <div className="absolute bottom-full left-0 mb-1 bg-white border border-[#e8e8e8] rounded-full shadow-xl px-2 py-1.5 flex items-center gap-0.5 z-20">
                {REACTIONS.map(r=>(
                  <button key={r.type} onClick={()=>{onReact(post,r.type);setShowPicker(false)}}
                    className={`text-xl p-1.5 rounded-full hover:scale-125 transition-all ${myReaction===r.type?'ring-2 ring-[#1a6b3a] bg-[#f9f9f7]':''}`}>
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={()=>document.getElementById('comment-input')?.focus()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7] border-x border-[#f0f0f0]">
            <MessageCircle className="w-4 h-4"/> Comment
          </button>
          <button onClick={()=>navigator.share?.({text:post.body.replace(/<[^>]*>/g,' ')}).catch(()=>{})}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7]">
            <Share2 className="w-4 h-4"/> Share
          </button>
        </div>

        {/* Comments */}
        <div className="border-t border-[#f0f0f0]">
          {comments.length===0 && (
            <p className="text-center text-xs text-[#aaa] py-6">No comments yet.</p>
          )}
          {comments.map(c=>(
            <div key={c.id} className="flex items-start gap-2.5 px-4 py-3 border-b border-[#f9f9f7]">
              <div className="w-8 h-8 bg-[#0a0a0a] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px]">{c.avatar}</div>
              <div className="flex-1">
                <div className="bg-[#f9f9f7] rounded-2xl px-3 py-2 inline-block max-w-full">
                  <p className="font-bold text-[#0a0a0a] text-xs">{c.author}</p>
                  <p className="text-[#0a0a0a] text-xs mt-0.5 leading-relaxed">{c.body}</p>
                </div>
                <p className="text-[#aaa] text-[10px] mt-1 ml-2">{formatDistanceToNow(new Date(c.created_at),{addSuffix:true})}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comment input */}
      <div className="border-t border-[#e8e8e8] bg-white px-3 py-3 flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px]">{av}</div>
        <div className="flex-1 flex items-center border border-[#e8e8e8] rounded-full bg-[#f9f9f7] px-3 py-2 gap-2">
          <input id="comment-input" value={commentText} onChange={e=>setCommentText(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&submitComment()}
            placeholder="Write a comment..."
            className="flex-1 text-xs outline-none bg-transparent placeholder-[#aaa]"/>
          <button onClick={submitComment} disabled={submitting||!commentText.trim()} className="text-[#1a6b3a] disabled:opacity-30">
            {submitting?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Send className="w-3.5 h-3.5"/>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Compressed Post Card ──────────────────────────────────────────────────────
function PostCard({ post, myReaction, onReact, onClick }:{
  post:Post; myReaction?:Reaction
  onReact:(post:Post,r:Reaction)=>void
  onClick:()=>void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const myR  = myReaction ? REACTIONS.find(r=>r.type===myReaction) : null
  const total = post.like_count+post.love_count+post.haha_count+post.wow_count+post.cry_count
  const topR  = REACTIONS.filter(r=>(post[`${r.type}_count` as keyof Post] as number)>0)
    .sort((a,b)=>(post[`${b.type}_count` as keyof Post] as number)-(post[`${a.type}_count` as keyof Post] as number)).slice(0,3)
  const plainBody = post.body.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()

  return (
    <div className="card animate-fade-in" onClick={()=>{ setShowPicker(false); onClick() }}>
      {/* Header */}
      <div className="flex items-start gap-2.5 p-3.5 pb-2">
        <div className="w-9 h-9 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">{post.avatar}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-[#0a0a0a] text-sm">{post.author}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-[#aaa] text-[10px]">{formatDistanceToNow(new Date(post.created_at),{addSuffix:true})}</p>
                <span className="text-[#aaa] text-[10px]">·</span>
                <span className="badge badge-green text-[9px]">{post.category}</span>
              </div>
            </div>
            <button onClick={e=>e.stopPropagation()} className="p-1 rounded-full hover:bg-[#f9f9f7] text-[#aaa]">
              <MoreHorizontal className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </div>

      {/* Compressed body */}
      <div className="px-3.5 pb-2">
        <p className="text-sm text-[#0a0a0a] leading-relaxed line-clamp-3">{plainBody}</p>
        {plainBody.length>150&&<span className="text-xs text-[#1a6b3a] font-semibold">See more</span>}
      </div>

      {/* Media thumbnail */}
      {post.image_url&&(
        <div className="mx-3.5 mb-2 rounded-xl overflow-hidden max-h-44">
          <img src={post.image_url} alt="" className="w-full object-cover max-h-44"/>
        </div>
      )}
      {post.video_url&&!post.image_url&&(
        <div className="mx-3.5 mb-2 rounded-xl overflow-hidden bg-[#0a0a0a]/80 h-24 flex items-center justify-center">
          <Video className="w-8 h-8 text-white/60"/>
        </div>
      )}

      {/* Reaction counts */}
      {(total>0||post.replies>0)&&(
        <div className="flex items-center justify-between px-3.5 py-1.5 border-t border-[#f0f0f0]">
          <div className="flex items-center gap-1">
            {topR.map(r=><span key={r.type} className="text-sm">{r.emoji}</span>)}
            {total>0&&<span className="text-[10px] text-[#aaa] ml-0.5">{total}</span>}
          </div>
          {post.replies>0&&<span className="text-[10px] text-[#aaa]">{post.replies} comment{post.replies!==1?'s':''}</span>}
        </div>
      )}

      {/* Action bar */}
      <div className="flex border-t border-[#f0f0f0]" onClick={e=>e.stopPropagation()}>
        <div className="flex-1 relative">
          <button onClick={()=>setShowPicker(p=>!p)}
            className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold hover:bg-[#f9f9f7] transition-all"
            style={{color: myR ? myR.color : '#1a6b3a'}}>
            {myR ? (
              <><span className="text-base leading-none">{myR.emoji}</span><span>{myR.label}</span></>
            ) : (
              /* Default Like — site theme, not emoji */
              <><ThumbsUp className="w-4 h-4"/><span>Like</span></>
            )}
          </button>
          {showPicker&&(
            <div className="absolute bottom-full left-0 mb-1 bg-white border border-[#e8e8e8] rounded-full shadow-xl px-2 py-1.5 flex items-center gap-0.5 z-20">
              {REACTIONS.map(r=>(
                <button key={r.type} onClick={()=>{onReact(post,r.type);setShowPicker(false)}}
                  className={`text-xl p-1.5 rounded-full hover:scale-125 transition-all ${myReaction===r.type?'ring-2 ring-[#1a6b3a] bg-[#f9f9f7]':''}`}>
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={onClick}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7] border-x border-[#f0f0f0]">
          <MessageCircle className="w-3.5 h-3.5"/> Comment
        </button>
        <button onClick={()=>navigator.share?.({text:plainBody}).catch(()=>{})}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7]">
          <Share2 className="w-3.5 h-3.5"/> Share
        </button>
      </div>
    </div>
  )
}

// ─── Main Forum Page ───────────────────────────────────────────────────────────
export default function ForumPage() {
  const { student } = useAuth()
  const [posts, setPosts]         = useState<Post[]>([])
  const [loading, setLoading]     = useState(true)
  const [cat, setCat]             = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [activePost, setActivePost] = useState<Post|null>(null)
  const [myReactions, setMyReactions] = useState<Record<string,Reaction>>({})

  const loadPosts = useCallback(async() => {
    setLoading(true)
    let q = supabase.from('forum_posts').select('*').order('created_at',{ascending:false})
    if(cat!=='All') q = q.eq('category',cat)
    const {data} = await q
    setPosts((data as Post[])||[])
    setLoading(false)
  },[cat])

  useEffect(()=>{ loadPosts() },[loadPosts])
  useEffect(()=>{
    try { const s=localStorage.getItem('forum_reactions'); if(s) setMyReactions(JSON.parse(s)) } catch{}
  },[])

  const handleReact = async(post:Post, reaction:Reaction) => {
    const prev = myReactions[post.id]
    const next  = {...myReactions}
    const upd:Partial<Post> = {}
    if(prev===reaction){
      delete next[post.id]
      upd[`${reaction}_count` as keyof Post] = Math.max(0,(post[`${reaction}_count` as keyof Post] as number)-1) as any
    } else {
      if(prev) upd[`${prev}_count` as keyof Post] = Math.max(0,(post[`${prev}_count` as keyof Post] as number)-1) as any
      next[post.id]=reaction
      upd[`${reaction}_count` as keyof Post] = ((post[`${reaction}_count` as keyof Post] as number)+1) as any
    }
    setMyReactions(next); localStorage.setItem('forum_reactions',JSON.stringify(next))
    setPosts(p=>p.map(x=>x.id===post.id?{...x,...upd}:x))
    if(activePost?.id===post.id) setActivePost(p=>p?{...p,...upd}:p)
    await supabase.from('forum_posts').update(upd).eq('id',post.id)
  }

  const av = (student?.name||'ST').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)

  return (
    <AppShell>
      <TopBar title="Community" subtitle="Ask questions, share knowledge"/>
      <div className="max-w-2xl mx-auto px-3 lg:px-5 py-4 space-y-3 pb-24 lg:pb-6">

        {/* Create post trigger */}
        <div className="card p-3.5">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={()=>setShowCreate(true)}>
            <div className="w-9 h-9 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">{av}</div>
            <div className="flex-1 bg-[#f9f9f7] rounded-full px-4 py-2.5 hover:bg-[#f0f0f0] transition-colors">
              <p className="text-[#aaa] text-sm">What's on your mind, {student?.name?.split(' ')[0]}?</p>
            </div>
          </div>
          <div className="flex items-center gap-0 mt-3 pt-3 border-t border-[#e8e8e8]">
            <button onClick={()=>setShowCreate(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7]">
              <ImageIcon className="w-4 h-4 text-[#1a6b3a]"/> Photo
            </button>
            <button onClick={()=>setShowCreate(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7]">
              <Video className="w-4 h-4 text-red-500"/> Video
            </button>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${cat===c?'bg-[#0a0a0a] text-white':'bg-white border border-[#e8e8e8] text-[#6b6b6b] hover:border-[#0a0a0a]'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : posts.length===0 ? (
          <div className="card p-10 text-center">
            <MessageCircle className="w-8 h-8 text-[#ddd] mx-auto mb-3"/>
            <p className="font-semibold text-[#0a0a0a] text-sm">No posts yet</p>
            <p className="text-[#aaa] text-xs mt-1">Be the first to start a conversation!</p>
            <button onClick={()=>setShowCreate(true)} className="btn-primary mt-4 mx-auto">Create Post</button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post=>(
              <PostCard key={post.id} post={post}
                myReaction={myReactions[post.id]}
                onReact={handleReact}
                onClick={()=>setActivePost(post)}/>
            ))}
          </div>
        )}
      </div>

      {/* Full-page post creator */}
      {showCreate && (
        <PostCreator
          onClose={()=>setShowCreate(false)}
          onPosted={()=>{ setShowCreate(false); loadPosts() }}/>
      )}

      {/* Full-page post viewer */}
      {activePost && (
        <PostView
          post={activePost}
          myReaction={myReactions[activePost.id]}
          onReact={handleReact}
          onClose={()=>setActivePost(null)}/>
      )}
    </AppShell>
  )
}
