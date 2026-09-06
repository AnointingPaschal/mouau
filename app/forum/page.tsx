'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import {
  X, Send, MessageCircle, Share2, Loader2, MoreHorizontal,
  Image as ImageIcon, Video, Bold, Italic, Underline,
  List, Link, AlignLeft, ThumbsUp, ArrowLeft, ChevronDown,
  Trash2, Edit2, Flag, Check, AlertTriangle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Reaction = 'like'|'love'|'haha'|'wow'|'cry'
type Post = {
  id:string; title:string; body:string; author:string; avatar:string; author_id:string
  category:string; image_url:string; video_url:string
  like_count:number; love_count:number; haha_count:number; wow_count:number; cry_count:number
  replies:number; views:number; tags:string[]; created_at:string
}
type Comment = { id:string; post_id:string; author:string; avatar:string; body:string; created_at:string }

const REACTIONS:{type:Reaction;emoji:string;label:string;color:string}[] = [
  {type:'like', emoji:'👍', label:'Like',  color:'#1a6b3a'},
  {type:'love', emoji:'❤️', label:'Love',  color:'#e11d48'},
  {type:'haha', emoji:'😂', label:'Haha',  color:'#d97706'},
  {type:'wow',  emoji:'😮', label:'Wow',   color:'#7c3aed'},
  {type:'cry',  emoji:'😢', label:'Cry',   color:'#2563eb'},
]
const CATS     = ['All','Admissions','Navigation','Accommodation','Study Help','Registration','Campus Life','General']
const POST_CATS = ['General','Admissions','Navigation','Accommodation','Study Help','Registration','Campus Life']

function notify(recipientId:string, type:string, title:string, body:string, postId:string, actor:string) {
  if(!recipientId || !recipientId.trim()) return
  supabase.from('notifications').insert({ recipient_id:recipientId, type, title, body, post_id:postId, actor, read:false }).then(()=>{})
}

// ─── Rich Toolbar ──────────────────────────────────────────────────────────────
function RichToolbar({ editorRef }:{ editorRef:React.RefObject<HTMLDivElement> }) {
  const exec=(cmd:string,val?:string)=>{ editorRef.current?.focus(); document.execCommand(cmd,false,val) }
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-t border-[#e8e8e8]">
      {[
        {icon:<Bold className="w-4 h-4"/>,     cmd:'bold'},
        {icon:<Italic className="w-4 h-4"/>,   cmd:'italic'},
        {icon:<Underline className="w-4 h-4"/>,cmd:'underline'},
        {icon:<List className="w-4 h-4"/>,     cmd:'insertUnorderedList'},
        {icon:<AlignLeft className="w-4 h-4"/>,cmd:'insertOrderedList'},
      ].map(t=>(
        <button key={t.cmd} onMouseDown={e=>{e.preventDefault();exec(t.cmd)}}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#f0f0f0] text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors">
          {t.icon}
        </button>
      ))}
      <div className="w-px h-5 bg-[#e8e8e8] mx-1"/>
      <button onMouseDown={e=>{e.preventDefault();const u=prompt('URL:');if(u)exec('createLink',u)}}
        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#f0f0f0] text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors">
        <Link className="w-4 h-4"/>
      </button>
    </div>
  )
}

// ─── Reaction Picker ───────────────────────────────────────────────────────────
function ReactionPicker({ myReaction, onReact, onClose }:{
  myReaction?:Reaction; onReact:(r:Reaction)=>void; onClose:()=>void
}) {
  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white border border-[#e8e8e8] rounded-full shadow-2xl px-2.5 py-2 flex items-end gap-1 z-30"
      onClick={e=>e.stopPropagation()}>
      {REACTIONS.map(r=>(
        <button key={r.type}
          onClick={()=>{onReact(r.type);onClose()}}
          className={`reaction-item text-[28px] leading-none flex flex-col items-center gap-0.5 cursor-pointer ${myReaction===r.type?'ring-2 ring-[#1a6b3a] rounded-full bg-[#f0f9f4]':''}`}
          title={r.label}>
          <span>{r.emoji}</span>
          <span className="text-[8px] font-semibold" style={{color:r.color}}>{r.label}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Post Options Menu ─────────────────────────────────────────────────────────
function PostMenu({ post, currentUserId, onEdit, onDelete, onClose }:{
  post:Post; currentUserId:string
  onEdit:()=>void; onDelete:()=>void; onClose:()=>void
}) {
  const isOwn = post.author_id === currentUserId || post.avatar === currentUserId.slice(0,2).toUpperCase()
  return (
    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#e8e8e8] rounded-2xl shadow-2xl overflow-hidden z-30 animate-fade-in"
      onClick={e=>e.stopPropagation()}>
      {isOwn ? (
        <>
          <button onClick={()=>{onEdit();onClose()}}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-[#0a0a0a] hover:bg-[#f9f9f7] transition-colors">
            <Edit2 className="w-4 h-4 text-[#6b6b6b]"/> Edit post
          </button>
          <div className="h-px bg-[#f0f0f0]"/>
          <button onClick={()=>{onDelete();onClose()}}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4"/> Delete post
          </button>
        </>
      ) : (
        <button onClick={onClose}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-[#6b6b6b] hover:bg-[#f9f9f7] transition-colors">
          <Flag className="w-4 h-4"/> Report post
        </button>
      )}
    </div>
  )
}

// ─── Like Button ───────────────────────────────────────────────────────────────
function LikeButton({ myReaction, onTogglePicker, pulseKey }:{
  myReaction?:Reaction; onTogglePicker:()=>void; pulseKey:number
}) {
  const myR = myReaction ? REACTIONS.find(r=>r.type===myReaction) : null
  return (
    <button onClick={onTogglePicker}
      className="flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-bold hover:bg-[#f9f9f7] transition-all select-none"
      style={{color: myR ? myR.color : '#1a6b3a'}}>
      {myR ? (
        <><span key={pulseKey} className="text-lg leading-none like-pulse">{myR.emoji}</span><span>{myR.label}</span></>
      ) : (
        <><ThumbsUp className="w-4 h-4" strokeWidth={2.5}/><span className="text-[#1a6b3a]">Like</span></>
      )}
    </button>
  )
}

// ─── Full-Page Post Creator / Editor ─────────────────────────────────────────
function PostEditor({ editPost, onClose, onSaved }:{
  editPost?:Post; onClose:()=>void; onSaved:()=>void
}) {
  const { student } = useAuth()
  const [postCat, setPostCat]     = useState(editPost?.category||'General')
  const [postFile, setPostFile]   = useState<File|null>(null)
  const [postPreview, setPostPreview] = useState<string|null>(editPost?.image_url||editPost?.video_url||null)
  const [isVideo, setIsVideo]     = useState(!!editPost?.video_url)
  const [posting, setPosting]     = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)
  const av = (student?.name||'ST').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)

  useEffect(()=>{
    if(editPost && editorRef.current) editorRef.current.innerHTML = editPost.body
  },[editPost])

  useEffect(()=>{
    const onPop=()=>onClose()
    window.history.pushState({modal:'post-editor'},'')
    window.addEventListener('popstate',onPop)
    return ()=>window.removeEventListener('popstate',onPop)
  },[onClose])

  const handleFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]; if(!f) return
    setPostFile(f); setIsVideo(f.type.startsWith('video/')); setPostPreview(URL.createObjectURL(f))
  }

  const submit=async()=>{
    const body=editorRef.current?.innerHTML||''
    if(!body.replace(/<[^>]*>/g,'').trim()) return
    setPosting(true)
    let mediaUrl=editPost?.image_url||editPost?.video_url||''
    if(postFile){
      const ext=postFile.name.split('.').pop()
      const path=`forum/${Date.now()}.${ext}`
      const {error}=await supabase.storage.from('materials').upload(path,postFile,{contentType:postFile.type})
      if(!error){ const {data:{publicUrl}}=supabase.storage.from('materials').getPublicUrl(path); mediaUrl=publicUrl }
    }
    if(editPost){
      await supabase.from('forum_posts').update({
        body, category:postCat,
        image_url:isVideo?'':mediaUrl, video_url:isVideo?mediaUrl:''
      }).eq('id',editPost.id)
    } else {
      await supabase.from('forum_posts').insert({
        title:body.replace(/<[^>]*>/g,' ').trim().slice(0,100),
        body, author:student?.name||'Anonymous', avatar:av,
        author_id:student?.idNumber||'', category:postCat, tags:[],
        image_url:isVideo?'':mediaUrl, video_url:isVideo?mediaUrl:'',
        replies:0, views:0, likes:0,
        like_count:0, love_count:0, haha_count:0, wow_count:0, cry_count:0,
      })
    }
    setPosting(false); onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e8e8] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#f0f0f0]">
            <X className="w-5 h-5 text-[#0a0a0a]"/>
          </button>
          <h2 className="font-black text-[#0a0a0a] text-lg">{editPost?'Edit Post':'Create Post'}</h2>
        </div>
        <button onClick={submit} disabled={posting}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${posting?'bg-[#1a6b3a]/40 text-white cursor-not-allowed':'bg-[#1a6b3a] text-white hover:bg-[#145530] active:scale-95'}`}>
          {posting?<Loader2 className="w-4 h-4 animate-spin"/>:editPost?'Save':'Post'}
        </button>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
        <div className="w-11 h-11 bg-[#1a6b3a] rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0">{av}</div>
        <div>
          <p className="font-bold text-[#0a0a0a] text-base">{student?.name}</p>
          <div className="flex items-center gap-1 mt-0.5 bg-[#f0f0f0] rounded-lg px-2.5 py-1">
            <select value={postCat} onChange={e=>setPostCat(e.target.value)}
              className="text-xs font-semibold text-[#0a0a0a] bg-transparent outline-none cursor-pointer">
              {POST_CATS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="w-3 h-3 text-[#6b6b6b]"/>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        <div ref={editorRef} contentEditable suppressContentEditableWarning
          data-placeholder={`What's on your mind, ${student?.name?.split(' ')[0]}?`}
          className="min-h-full text-[17px] text-[#0a0a0a] outline-none leading-relaxed pb-20 empty:before:content-[attr(data-placeholder)] empty:before:text-[#aaa] empty:before:pointer-events-none"/>
        {postPreview&&(
          <div className="relative rounded-xl overflow-hidden border border-[#e8e8e8] mb-4">
            {isVideo?<video src={postPreview} className="w-full max-h-64 bg-black" controls/>
              :<img src={postPreview} alt="" className="w-full max-h-64 object-cover"/>}
            <button onClick={()=>{setPostFile(null);setPostPreview(null)}}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5"><X className="w-4 h-4"/></button>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 border-t border-[#e8e8e8] bg-white">
        <RichToolbar editorRef={editorRef}/>
        <div className="flex items-center gap-1 px-4 py-3 border-t border-[#e8e8e8]">
          <span className="text-xs font-semibold text-[#6b6b6b] mr-2">Add to post</span>
          <button onClick={()=>fileRef.current?.click()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f0f0f0]"><ImageIcon className="w-5 h-5 text-[#1a6b3a]"/></button>
          <button onClick={()=>fileRef.current?.click()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f0f0f0]"><Video className="w-5 h-5 text-red-500"/></button>
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile}/>
      </div>
    </div>
  )
}

// ─── Full Post View ────────────────────────────────────────────────────────────
function PostView({ post, myReaction, onReact, onClose, currentUserId }:{
  post:Post; myReaction?:Reaction; currentUserId:string
  onReact:(post:Post,r:Reaction)=>void; onClose:()=>void
}) {
  const { student } = useAuth()
  const [comments, setComments]   = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [showPicker, setShowPicker]   = useState(false)
  const [pulseKey, setPulseKey]       = useState(0)
  const av = (student?.name||'ST').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)

  useEffect(()=>{
    const onPop=()=>onClose()
    window.history.pushState({modal:'post-view'},'')
    window.addEventListener('popstate',onPop)
    return ()=>window.removeEventListener('popstate',onPop)
  },[onClose])

  useEffect(()=>{
    supabase.from('forum_comments').select('*').eq('post_id',post.id).order('created_at')
      .then(({data})=>{ if(data) setComments(data as Comment[]) })
  },[post.id])

  const submitComment=async()=>{
    if(!commentText.trim()||submitting) return
    setSubmitting(true)
    await supabase.from('forum_comments').insert({
      post_id:post.id, author:student?.name||'Anonymous', avatar:av, body:commentText.trim()
    })
    await supabase.from('forum_posts').update({replies:(post.replies||0)+1}).eq('id',post.id)
    if(post.author_id && post.author_id !== student?.idNumber) {
      notify(post.author_id,'comment',`${student?.name} commented on your post`,commentText.trim().slice(0,80),post.id,student?.name||'')
    }
    setCommentText('')
    const {data}=await supabase.from('forum_comments').select('*').eq('post_id',post.id).order('created_at')
    if(data) setComments(data as Comment[])
    setSubmitting(false)
  }

  const handleReact=(r:Reaction)=>{
    setPulseKey(k=>k+1); setShowPicker(false)
    if(post.author_id && post.author_id !== student?.idNumber) {
      const rx = REACTIONS.find(x=>x.type===r)
      notify(post.author_id,'reaction',`${student?.name} reacted ${rx?.emoji} to your post`,'',post.id,student?.name||'')
    }
    onReact(post,r)
  }

  const myR   = myReaction ? REACTIONS.find(r=>r.type===myReaction) : null
  const total = post.like_count+post.love_count+post.haha_count+post.wow_count+post.cry_count
  const topR  = REACTIONS.filter(r=>(post[`${r.type}_count` as keyof Post] as number)>0)
    .sort((a,b)=>(post[`${b.type}_count` as keyof Post] as number)-(post[`${a.type}_count` as keyof Post] as number)).slice(0,3)

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e8e8e8] flex-shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#f0f0f0]"><ArrowLeft className="w-5 h-5 text-[#0a0a0a]"/></button>
        <div className="flex-1 min-w-0">
          <p className="font-black text-[#0a0a0a] text-sm">{post.author}</p>
          <p className="text-[10px] text-[#aaa]">{formatDistanceToNow(new Date(post.created_at),{addSuffix:true})}</p>
        </div>
        <span className="badge badge-green text-[9px]">{post.category}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 bg-[#1a6b3a] rounded-full flex items-center justify-center text-white font-bold">{post.avatar}</div>
            <div><p className="font-bold text-[#0a0a0a] text-sm">{post.author}</p><p className="text-[10px] text-[#aaa]">{formatDistanceToNow(new Date(post.created_at),{addSuffix:true})}</p></div>
          </div>
          <div className="text-sm text-[#0a0a0a] leading-relaxed" dangerouslySetInnerHTML={{__html:post.body.replace(/\n/g,'<br/>')}}/>
          {post.image_url&&<img src={post.image_url} alt="" className="w-full rounded-xl mt-3 object-cover max-h-80"/>}
          {post.video_url&&<video src={post.video_url} controls className="w-full mt-3 rounded-xl bg-black max-h-64"/>}
        </div>
        {(total>0||post.replies>0)&&(
          <div className="flex items-center justify-between px-4 py-2 border-t border-[#f0f0f0]">
            <div className="flex items-center gap-1">
              {topR.map(r=><span key={r.type} className="text-sm">{r.emoji}</span>)}
              {total>0&&<span className="text-[11px] text-[#aaa] ml-1">{total}</span>}
            </div>
            {post.replies>0&&<span className="text-[11px] text-[#aaa]">{post.replies} comment{post.replies!==1?'s':''}</span>}
          </div>
        )}
        <div className="flex border-t border-[#f0f0f0]">
          <div className="flex-1 relative">
            <LikeButton myReaction={myReaction} onTogglePicker={()=>setShowPicker(p=>!p)} pulseKey={pulseKey}/>
            {showPicker&&<ReactionPicker myReaction={myReaction} onReact={handleReact} onClose={()=>setShowPicker(false)}/>}
          </div>
          <button onClick={()=>document.getElementById('cmt-input')?.focus()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7] border-x border-[#f0f0f0]">
            <MessageCircle className="w-4 h-4"/> Comment
          </button>
          <button onClick={()=>navigator.share?.({text:post.body.replace(/<[^>]*>/g,' ')}).catch(()=>{})}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7]">
            <Share2 className="w-4 h-4"/> Share
          </button>
        </div>
        <div className="border-t border-[#f0f0f0]">
          {comments.length===0&&<p className="text-center text-xs text-[#aaa] py-6">No comments yet.</p>}
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
      <div className="border-t border-[#e8e8e8] bg-white px-3 py-3 flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px]">{av}</div>
        <div className="flex-1 flex items-center border border-[#e8e8e8] rounded-full bg-[#f9f9f7] px-3 py-2 gap-2">
          <input id="cmt-input" value={commentText} onChange={e=>setCommentText(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&submitComment()} placeholder="Write a comment..."
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
function PostCard({ post, myReaction, onReact, onClick, currentUserId, onEdit, onDelete }:{
  post:Post; myReaction?:Reaction; currentUserId:string
  onReact:(post:Post,r:Reaction)=>void; onClick:()=>void
  onEdit:(post:Post)=>void; onDelete:(post:Post)=>void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [showMenu,   setShowMenu]   = useState(false)
  const [pulseKey,   setPulseKey]   = useState(0)
  const total = post.like_count+post.love_count+post.haha_count+post.wow_count+post.cry_count
  const topR  = REACTIONS.filter(r=>(post[`${r.type}_count` as keyof Post] as number)>0)
    .sort((a,b)=>(post[`${b.type}_count` as keyof Post] as number)-(post[`${a.type}_count` as keyof Post] as number)).slice(0,3)
  const plain = post.body.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()

  const handleReact=(r:Reaction)=>{ setPulseKey(k=>k+1); setShowPicker(false); onReact(post,r) }

  return (
    <div className="card animate-fade-in" onClick={()=>{ setShowPicker(false); setShowMenu(false); onClick() }}>
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
            <div className="relative" onClick={e=>e.stopPropagation()}>
              <button onClick={()=>setShowMenu(p=>!p)} className="p-1 rounded-full hover:bg-[#f9f9f7] text-[#aaa]">
                <MoreHorizontal className="w-4 h-4"/>
              </button>
              {showMenu&&<PostMenu post={post} currentUserId={currentUserId}
                onEdit={()=>onEdit(post)} onDelete={()=>onDelete(post)} onClose={()=>setShowMenu(false)}/>}
            </div>
          </div>
        </div>
      </div>
      <div className="px-3.5 pb-2">
        <p className="text-sm text-[#0a0a0a] leading-relaxed line-clamp-3">{plain}</p>
        {plain.length>150&&<span className="text-xs text-[#1a6b3a] font-semibold">See more</span>}
      </div>
      {post.image_url&&<div className="mx-3.5 mb-2 rounded-xl overflow-hidden max-h-44"><img src={post.image_url} alt="" className="w-full object-cover max-h-44"/></div>}
      {post.video_url&&!post.image_url&&<div className="mx-3.5 mb-2 rounded-xl bg-[#0a0a0a]/80 h-24 flex items-center justify-center"><Video className="w-8 h-8 text-white/60"/></div>}
      {(total>0||post.replies>0)&&(
        <div className="flex items-center justify-between px-3.5 py-1.5 border-t border-[#f0f0f0]">
          <div className="flex items-center gap-1">
            {topR.map(r=><span key={r.type} className="text-sm">{r.emoji}</span>)}
            {total>0&&<span className="text-[10px] text-[#aaa] ml-0.5">{total}</span>}
          </div>
          {post.replies>0&&<span className="text-[10px] text-[#aaa]">{post.replies} comment{post.replies!==1?'s':''}</span>}
        </div>
      )}
      <div className="flex border-t border-[#f0f0f0]" onClick={e=>e.stopPropagation()}>
        <div className="flex-1 relative">
          <LikeButton myReaction={myReaction} onTogglePicker={()=>setShowPicker(p=>!p)} pulseKey={pulseKey}/>
          {showPicker&&<ReactionPicker myReaction={myReaction} onReact={handleReact} onClose={()=>setShowPicker(false)}/>}
        </div>
        <button onClick={onClick} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7] border-x border-[#f0f0f0]">
          <MessageCircle className="w-3.5 h-3.5"/> Comment
        </button>
        <button onClick={()=>navigator.share?.({text:plain}).catch(()=>{})} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7]">
          <Share2 className="w-3.5 h-3.5"/> Share
        </button>
      </div>
    </div>
  )
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ onConfirm, onCancel }:{ onConfirm:()=>void; onCancel:()=>void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 bg-black/50">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5 text-red-500"/></div>
          <div><p className="font-black text-[#0a0a0a]">Delete Post?</p><p className="text-xs text-[#aaa] mt-0.5">This cannot be undone.</p></div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7]">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 rounded-xl text-sm font-semibold text-white hover:bg-red-600">Delete</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ForumPage() {
  const { student } = useAuth()
  const [posts, setPosts]         = useState<Post[]>([])
  const [loading, setLoading]     = useState(true)
  const [cat, setCat]             = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [editPost,   setEditPost]   = useState<Post|null>(null)
  const [activePost, setActivePost] = useState<Post|null>(null)
  const [deletePost, setDeletePost] = useState<Post|null>(null)
  const [myReactions, setMyReactions] = useState<Record<string,Reaction>>({})

  const loadPosts=useCallback(async()=>{
    setLoading(true)
    let q=supabase.from('forum_posts').select('*').order('created_at',{ascending:false})
    if(cat!=='All') q=q.eq('category',cat)
    const {data}=await q
    setPosts((data as Post[])||[])
    setLoading(false)
  },[cat])

  useEffect(()=>{ loadPosts() },[loadPosts])
  useEffect(()=>{
    try{ const s=localStorage.getItem('forum_reactions'); if(s) setMyReactions(JSON.parse(s)) }catch{}
  },[])

  const handleReact=async(post:Post,reaction:Reaction)=>{
    const prev=myReactions[post.id]; const next={...myReactions}; const upd:Partial<Post>={}
    if(prev===reaction){ delete next[post.id]; upd[`${reaction}_count` as keyof Post]=Math.max(0,(post[`${reaction}_count` as keyof Post] as number)-1) as any }
    else{ if(prev) upd[`${prev}_count` as keyof Post]=Math.max(0,(post[`${prev}_count` as keyof Post] as number)-1) as any; next[post.id]=reaction; upd[`${reaction}_count` as keyof Post]=((post[`${reaction}_count` as keyof Post] as number)+1) as any }
    setMyReactions(next); localStorage.setItem('forum_reactions',JSON.stringify(next))
    setPosts(p=>p.map(x=>x.id===post.id?{...x,...upd}:x))
    if(activePost?.id===post.id) setActivePost(p=>p?{...p,...upd}:p)
    await supabase.from('forum_posts').update(upd).eq('id',post.id)
  }

  const handleDelete=async()=>{
    if(!deletePost) return
    await supabase.from('forum_posts').delete().eq('id',deletePost.id)
    setDeletePost(null); loadPosts()
  }

  const av=(student?.name||'ST').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
  const uid=student?.idNumber||''

  return (
    <AppShell>
      <TopBar title="Community" subtitle="Ask questions, share knowledge"/>
      <div className="max-w-2xl mx-auto px-3 lg:px-5 py-4 space-y-3 pb-24 lg:pb-6">
        <div className="card p-3.5">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={()=>setShowCreate(true)}>
            <div className="w-9 h-9 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">{av}</div>
            <div className="flex-1 bg-[#f9f9f7] rounded-full px-4 py-2.5 hover:bg-[#f0f0f0] transition-colors">
              <p className="text-[#aaa] text-sm">What's on your mind, {student?.name?.split(' ')[0]}?</p>
            </div>
          </div>
          <div className="flex gap-0 mt-3 pt-3 border-t border-[#e8e8e8]">
            <button onClick={()=>setShowCreate(true)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7]">
              <ImageIcon className="w-4 h-4 text-[#1a6b3a]"/> Photo
            </button>
            <button onClick={()=>setShowCreate(true)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7]">
              <Video className="w-4 h-4 text-red-500"/> Video
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${cat===c?'bg-[#0a0a0a] text-white':'bg-white border border-[#e8e8e8] text-[#6b6b6b] hover:border-[#0a0a0a]'}`}>
              {c}
            </button>
          ))}
        </div>
        {loading?(
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ):posts.length===0?(
          <div className="card p-10 text-center">
            <MessageCircle className="w-8 h-8 text-[#ddd] mx-auto mb-3"/>
            <p className="font-semibold text-[#0a0a0a] text-sm">No posts yet</p>
            <button onClick={()=>setShowCreate(true)} className="btn-primary mt-4 mx-auto">Create Post</button>
          </div>
        ):(
          <div className="space-y-3">
            {posts.map(post=>(
              <PostCard key={post.id} post={post} myReaction={myReactions[post.id]}
                currentUserId={uid} onReact={handleReact} onClick={()=>setActivePost(post)}
                onEdit={p=>{ setEditPost(p) }} onDelete={p=>setDeletePost(p)}/>
            ))}
          </div>
        )}
      </div>

      {(showCreate||editPost)&&(
        <PostEditor editPost={editPost||undefined}
          onClose={()=>{ setShowCreate(false); setEditPost(null) }}
          onSaved={()=>{ setShowCreate(false); setEditPost(null); loadPosts() }}/>
      )}
      {activePost&&(
        <PostView post={activePost} myReaction={myReactions[activePost.id]}
          currentUserId={uid} onReact={handleReact} onClose={()=>setActivePost(null)}/>
      )}
      {deletePost&&<DeleteConfirm onConfirm={handleDelete} onCancel={()=>setDeletePost(null)}/>}
    </AppShell>
  )
}
