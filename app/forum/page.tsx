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
  Trash2, Edit2, Flag, AlertTriangle, ChevronUp, CornerDownRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Reaction = 'like'|'love'|'haha'|'wow'|'cry'
type Post = { id:string; title:string; body:string; author:string; avatar:string; author_id:string; category:string; image_url:string; video_url:string; like_count:number; love_count:number; haha_count:number; wow_count:number; cry_count:number; replies:number; created_at:string }
type Comment = { id:string; post_id:string; author:string; avatar:string; author_id:string; body:string; like_count:number; reply_count:number; created_at:string }
type Reply   = { id:string; comment_id:string; author:string; avatar:string; author_id:string; body:string; like_count:number; created_at:string }

const REACTIONS = [
  {type:'like'  as Reaction,emoji:'👍',label:'Like', color:'#1a6b3a'},
  {type:'love'  as Reaction,emoji:'❤️',label:'Love', color:'#e11d48'},
  {type:'haha'  as Reaction,emoji:'😂',label:'Haha', color:'#d97706'},
  {type:'wow'   as Reaction,emoji:'😮',label:'Wow',  color:'#7c3aed'},
  {type:'cry'   as Reaction,emoji:'😢',label:'Cry',  color:'#2563eb'},
]
const CATS     = ['All','Admissions','Navigation','Accommodation','Study Help','Registration','Campus Life','General']
const POST_CATS = ['General','Admissions','Navigation','Accommodation','Study Help','Registration','Campus Life']

const notify = (recipientId:string, type:string, title:string, body:string, postId:string, actor:string) => {
  if(!recipientId?.trim()) return
  supabase.from('notifications').insert({recipient_id:recipientId,type,title,body,post_id:postId,actor,read:false}).then(()=>{})
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
function RichToolbar({editorRef}:{editorRef:React.RefObject<HTMLDivElement>}) {
  const exec=(cmd:string)=>{editorRef.current?.focus();document.execCommand(cmd,false)}
  return (
    <div className="flex items-center gap-0.5 px-4 py-2 border-t border-[#e8e8e8]">
      {[{icon:<Bold className="w-4 h-4"/>,cmd:'bold'},{icon:<Italic className="w-4 h-4"/>,cmd:'italic'},{icon:<Underline className="w-4 h-4"/>,cmd:'underline'},{icon:<List className="w-4 h-4"/>,cmd:'insertUnorderedList'},{icon:<AlignLeft className="w-4 h-4"/>,cmd:'insertOrderedList'}].map(t=>(
        <button key={t.cmd} onMouseDown={e=>{e.preventDefault();exec(t.cmd)}} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#f0f0f0] text-[#6b6b6b]">{t.icon}</button>
      ))}
      <div className="w-px h-5 bg-[#e8e8e8] mx-1"/>
      <button onMouseDown={e=>{e.preventDefault();const u=prompt('URL:');if(u){editorRef.current?.focus();document.execCommand('createLink',false,u)}}} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#f0f0f0] text-[#6b6b6b]"><Link className="w-4 h-4"/></button>
    </div>
  )
}

// ─── Reaction Picker ───────────────────────────────────────────────────────────
function ReactionPicker({myReaction,onReact,onClose}:{myReaction?:Reaction;onReact:(r:Reaction)=>void;onClose:()=>void}) {
  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white border border-[#e8e8e8] rounded-full shadow-2xl px-2.5 py-2 flex items-end gap-1 z-30" onClick={e=>e.stopPropagation()}>
      {REACTIONS.map(r=>(
        <button key={r.type} onClick={()=>{onReact(r.type);onClose()}}
          className={`reaction-item text-[28px] leading-none flex flex-col items-center gap-0.5 ${myReaction===r.type?'ring-2 ring-[#1a6b3a] rounded-full':''}`}>
          <span>{r.emoji}</span>
          <span className="text-[8px] font-semibold" style={{color:r.color}}>{r.label}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Post Options ──────────────────────────────────────────────────────────────
function PostMenu({post,myId,onEdit,onDelete,onClose}:{post:Post;myId:string;onEdit:()=>void;onDelete:()=>void;onClose:()=>void}) {
  const own = post.author_id===myId
  return (
    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#e8e8e8] rounded-2xl shadow-2xl overflow-hidden z-30 animate-fade-in" onClick={e=>e.stopPropagation()}>
      {own ? (
        <>
          <button onClick={()=>{onEdit();onClose()}} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-[#0a0a0a] hover:bg-[#f9f9f7]"><Edit2 className="w-4 h-4 text-[#6b6b6b]"/> Edit post</button>
          <div className="h-px bg-[#f0f0f0]"/>
          <button onClick={()=>{onDelete();onClose()}} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4"/> Delete post</button>
        </>
      ):(
        <button onClick={onClose} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-[#6b6b6b] hover:bg-[#f9f9f7]"><Flag className="w-4 h-4"/> Report post</button>
      )}
    </div>
  )
}

// ─── Comment with Replies ─────────────────────────────────────────────────────
function CommentItem({comment,myId,postId,postAuthorId}:{comment:Comment;myId:string;postId:string;postAuthorId:string}) {
  const {student} = useAuth()
  const [liked,      setLiked]      = useState(false)
  const [likeCount,  setLikeCount]  = useState(comment.like_count||0)
  const [showReply,  setShowReply]  = useState(false)
  const [replies,    setReplies]    = useState<Reply[]>([])
  const [showReplies,setShowReplies]= useState(false)
  const [repliesLoaded,setLoaded]   = useState(false)
  const [replyText,  setReplyText]  = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pulsing,    setPulsing]    = useState(false)
  const av = (student?.name||'ST').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)

  useEffect(()=>{
    try{const k=`clike_${comment.id}_${myId}`;setLiked(localStorage.getItem(k)==='1')}catch{}
  },[comment.id,myId])

  const loadReplies=async()=>{
    const{data}=await supabase.from('forum_comment_replies').select('*').eq('comment_id',comment.id).order('created_at')
    setReplies((data as Reply[])||[])
    setLoaded(true)
  }

  const toggleReplies=()=>{
    if(!repliesLoaded) loadReplies()
    setShowReplies(p=>!p)
  }

  const likeComment=async()=>{
    const k=`clike_${comment.id}_${myId}`
    if(liked){
      setLiked(false);setLikeCount(n=>Math.max(0,n-1));localStorage.removeItem(k)
      await supabase.from('forum_comments').update({like_count:Math.max(0,likeCount-1)}).eq('id',comment.id)
    } else {
      setLiked(true);setLikeCount(n=>n+1);localStorage.setItem(k,'1');setPulsing(true);setTimeout(()=>setPulsing(false),400)
      await supabase.from('forum_comments').update({like_count:likeCount+1}).eq('id',comment.id)
    }
  }

  const submitReply=async()=>{
    if(!replyText.trim()||submitting) return
    setSubmitting(true)
    const {data}=await supabase.from('forum_comment_replies').insert({
      comment_id:comment.id, post_id:postId, author:student?.name||'Anonymous',
      avatar:av, author_id:myId, body:replyText.trim(), like_count:0
    }).select().single()
    await supabase.from('forum_comments').update({reply_count:(comment.reply_count||0)+1}).eq('id',comment.id)
    if(comment.author_id&&comment.author_id!==myId)
      notify(comment.author_id,'reply',`${student?.name} replied to your comment`,replyText.trim().slice(0,80),postId,student?.name||'')
    setReplyText('');setShowReply(false)
    if(data) setReplies(r=>[...r,data as Reply])
    setShowReplies(true);setLoaded(true);setSubmitting(false)
  }

  const replyCount = replies.length || (comment.reply_count||0)

  return (
    <div className="flex items-start gap-2.5 px-4 py-3 border-b border-[#f9f9f7]">
      <div className="w-8 h-8 bg-[#0a0a0a] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px] mt-0.5">{comment.avatar}</div>
      <div className="flex-1 min-w-0">
        {/* Comment bubble */}
        <div className="bg-[#f9f9f7] rounded-2xl px-3 py-2 inline-block max-w-full">
          <p className="font-bold text-[#0a0a0a] text-xs">{comment.author}</p>
          <p className="text-[#0a0a0a] text-xs mt-0.5 leading-relaxed">{comment.body}</p>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-3 mt-1.5 ml-1">
          <p className="text-[#aaa] text-[10px]">{formatDistanceToNow(new Date(comment.created_at),{addSuffix:true})}</p>
          <button onClick={likeComment}
            className={`flex items-center gap-1 text-[10px] font-bold transition-all ${liked?'text-[#1a6b3a]':'text-[#aaa] hover:text-[#1a6b3a]'}`}>
            <ThumbsUp className={`w-3 h-3 ${pulsing?'like-pulse':''}`} fill={liked?'currentColor':'none'}/>
            {likeCount>0&&<span>{likeCount}</span>}
          </button>
          <button onClick={()=>setShowReply(p=>!p)} className="text-[10px] font-bold text-[#aaa] hover:text-[#1a6b3a]">Reply</button>
          {replyCount>0&&(
            <button onClick={toggleReplies} className="flex items-center gap-1 text-[10px] font-bold text-[#1a6b3a]">
              {showReplies?<ChevronUp className="w-3 h-3"/>:<ChevronDown className="w-3 h-3"/>}
              {replyCount} {replyCount===1?'reply':'replies'}
            </button>
          )}
        </div>

        {/* Reply input */}
        {showReply&&(
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 bg-[#1a6b3a] rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">{av}</div>
            <div className="flex-1 flex items-center border border-[#e8e8e8] rounded-full bg-[#f9f9f7] px-2.5 py-1.5 gap-1.5">
              <input value={replyText} onChange={e=>setReplyText(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&submitReply()}
                placeholder={`Reply to ${comment.author}...`}
                className="flex-1 text-[11px] outline-none bg-transparent placeholder-[#aaa]"/>
              <button onClick={submitReply} disabled={submitting||!replyText.trim()} className="text-[#1a6b3a] disabled:opacity-30">
                {submitting?<Loader2 className="w-3 h-3 animate-spin"/>:<Send className="w-3 h-3"/>}
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        {showReplies&&replies.map(r=>(
          <div key={r.id} className="flex items-start gap-2 mt-2 ml-2">
            <CornerDownRight className="w-3.5 h-3.5 text-[#ddd] flex-shrink-0 mt-1.5"/>
            <div className="w-6 h-6 bg-[#6b6b6b] rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">{r.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="bg-[#f9f9f7] rounded-2xl px-2.5 py-1.5 inline-block max-w-full">
                <p className="font-bold text-[#0a0a0a] text-[11px]">{r.author}</p>
                <p className="text-[#0a0a0a] text-[11px] mt-0.5 leading-relaxed">{r.body}</p>
              </div>
              <p className="text-[#aaa] text-[9px] mt-0.5 ml-1">{formatDistanceToNow(new Date(r.created_at),{addSuffix:true})}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Post Editor ───────────────────────────────────────────────────────────────
function PostEditor({editPost,onClose,onSaved}:{editPost?:Post;onClose:()=>void;onSaved:()=>void}) {
  const {student}=useAuth()
  const [cat,setcat]=useState(editPost?.category||'General')
  const [file,setFile]=useState<File|null>(null)
  const [preview,setPreview]=useState<string|null>(editPost?.image_url||editPost?.video_url||null)
  const [isVid,setIsVid]=useState(!!editPost?.video_url)
  const [posting,setPosting]=useState(false)
  const edRef=useRef<HTMLDivElement>(null)
  const fRef=useRef<HTMLInputElement>(null)
  const av=(student?.name||'ST').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)

  useEffect(()=>{if(editPost&&edRef.current) edRef.current.innerHTML=editPost.body},[editPost])
  useEffect(()=>{
    const fn=()=>onClose();window.history.pushState({modal:'post-editor'},'');window.addEventListener('popstate',fn)
    return ()=>window.removeEventListener('popstate',fn)
  },[onClose])

  const onFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0];if(!f)return;setFile(f);setIsVid(f.type.startsWith('video/'));setPreview(URL.createObjectURL(f))
  }
  const submit=async()=>{
    const body=edRef.current?.innerHTML||''
    if(!body.replace(/<[^>]*>/g,'').trim())return
    setPosting(true)
    let url=editPost?.image_url||editPost?.video_url||''
    if(file){const ext=file.name.split('.').pop();const path=`forum/${Date.now()}.${ext}`;const{error}=await supabase.storage.from('materials').upload(path,file,{contentType:file.type});if(!error){const{data:{publicUrl}}=supabase.storage.from('materials').getPublicUrl(path);url=publicUrl}}
    if(editPost){
      await supabase.from('forum_posts').update({body,category:cat,image_url:isVid?'':url,video_url:isVid?url:''}).eq('id',editPost.id)
    }else{
      await supabase.from('forum_posts').insert({title:body.replace(/<[^>]*>/g,' ').trim().slice(0,100),body,author:student?.name||'Anonymous',avatar:av,author_id:student?.idNumber||'',category:cat,tags:[],image_url:isVid?'':url,video_url:isVid?url:'',replies:0,views:0,likes:0,like_count:0,love_count:0,haha_count:0,wow_count:0,cry_count:0})
    }
    setPosting(false);onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e8e8] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#f0f0f0]"><X className="w-5 h-5"/></button>
          <h2 className="font-black text-[#0a0a0a] text-lg">{editPost?'Edit Post':'Create Post'}</h2>
        </div>
        <button onClick={submit} disabled={posting} className={`px-5 py-2 rounded-xl text-sm font-bold ${posting?'bg-[#1a6b3a]/40 text-white':'bg-[#1a6b3a] text-white hover:bg-[#145530]'}`}>
          {posting?<Loader2 className="w-4 h-4 animate-spin"/>:editPost?'Save':'Post'}
        </button>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
        <div className="w-11 h-11 bg-[#1a6b3a] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">{av}</div>
        <div>
          <p className="font-bold text-[#0a0a0a]">{student?.name}</p>
          <div className="flex items-center gap-1 mt-0.5 bg-[#f0f0f0] rounded-lg px-2.5 py-1">
            <select value={cat} onChange={e=>setcat(e.target.value)} className="text-xs font-semibold bg-transparent outline-none">
              {POST_CATS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        <div ref={edRef} contentEditable suppressContentEditableWarning data-placeholder={`What's on your mind, ${student?.name?.split(' ')[0]}?`}
          className="min-h-full text-[17px] text-[#0a0a0a] outline-none leading-relaxed pb-20 empty:before:content-[attr(data-placeholder)] empty:before:text-[#aaa] empty:before:pointer-events-none"/>
        {preview&&(
          <div className="relative rounded-xl overflow-hidden border border-[#e8e8e8] mb-4">
            {isVid?<video src={preview} className="w-full max-h-64 bg-black" controls/>:<img src={preview} alt="" className="w-full max-h-64 object-cover"/>}
            <button onClick={()=>{setFile(null);setPreview(null)}} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5"><X className="w-4 h-4"/></button>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 border-t border-[#e8e8e8] bg-white">
        <RichToolbar editorRef={edRef}/>
        <div className="flex items-center gap-1 px-4 py-3 border-t border-[#e8e8e8]">
          <span className="text-xs font-semibold text-[#6b6b6b] mr-2">Add to post</span>
          <button onClick={()=>fRef.current?.click()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f0f0f0]"><ImageIcon className="w-5 h-5 text-[#1a6b3a]"/></button>
          <button onClick={()=>fRef.current?.click()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f0f0f0]"><Video className="w-5 h-5 text-red-500"/></button>
        </div>
        <input ref={fRef} type="file" accept="image/*,video/*" className="hidden" onChange={onFile}/>
      </div>
    </div>
  )
}

// ─── Full Post View with comment replies ───────────────────────────────────────
function PostView({post,myReaction,onReact,onClose,myId}:{post:Post;myReaction?:Reaction;myId:string;onReact:(p:Post,r:Reaction)=>void;onClose:()=>void}) {
  const {student}=useAuth()
  const [comments,  setComments]  = useState<Comment[]>([])
  const [expanded,  setExpanded]  = useState(false)
  const [commentText,setText]     = useState('')
  const [submitting,setSubmitting]= useState(false)
  const [showPicker,setPicker]    = useState(false)
  const [pulseKey,  setPulse]     = useState(0)
  const av=(student?.name||'ST').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)

  useEffect(()=>{
    const fn=()=>onClose();window.history.pushState({modal:'post-view'},'');window.addEventListener('popstate',fn)
    return ()=>window.removeEventListener('popstate',fn)
  },[onClose])
  useEffect(()=>{
    supabase.from('forum_comments').select('*').eq('post_id',post.id).order('created_at').then(({data})=>{if(data)setComments(data as Comment[])})
  },[post.id])

  const submitComment=async()=>{
    if(!commentText.trim()||submitting)return
    setSubmitting(true)
    await supabase.from('forum_comments').insert({post_id:post.id,author:student?.name||'Anonymous',avatar:av,author_id:myId,body:commentText.trim(),like_count:0,reply_count:0})
    await supabase.from('forum_posts').update({replies:(post.replies||0)+1}).eq('id',post.id)
    if(post.author_id&&post.author_id!==myId) notify(post.author_id,'comment',`${student?.name} commented on your post`,commentText.trim().slice(0,80),post.id,student?.name||'')
    setText('')
    const{data}=await supabase.from('forum_comments').select('*').eq('post_id',post.id).order('created_at')
    if(data)setComments(data as Comment[])
    setSubmitting(false);setExpanded(true)
  }

  const handleReact=(r:Reaction)=>{setPulse(k=>k+1);setPicker(false);if(post.author_id&&post.author_id!==myId){const rx=REACTIONS.find(x=>x.type===r);notify(post.author_id,'reaction',`${student?.name} reacted ${rx?.emoji} to your post`,'',post.id,student?.name||'')}onReact(post,r)}

  const myR=myReaction?REACTIONS.find(r=>r.type===myReaction):null
  const total=post.like_count+post.love_count+post.haha_count+post.wow_count+post.cry_count
  const topR=REACTIONS.filter(r=>(post[`${r.type}_count` as keyof Post] as number)>0).sort((a,b)=>(post[`${b.type}_count` as keyof Post] as number)-(post[`${a.type}_count` as keyof Post] as number)).slice(0,3)
  const SHOW=2
  const visible = expanded ? comments : comments.slice(0,SHOW)
  const hidden  = comments.length - SHOW

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e8e8e8] flex-shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#f0f0f0]"><ArrowLeft className="w-5 h-5"/></button>
        <div className="flex-1 min-w-0">
          <p className="font-black text-[#0a0a0a] text-sm">{post.author}</p>
          <p className="text-[10px] text-[#aaa]">{formatDistanceToNow(new Date(post.created_at),{addSuffix:true})}</p>
        </div>
        <span className="badge badge-green text-[9px]">{post.category}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Post body */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 bg-[#1a6b3a] rounded-full flex items-center justify-center text-white font-bold">{post.avatar}</div>
            <div><p className="font-bold text-[#0a0a0a] text-sm">{post.author}</p><p className="text-[10px] text-[#aaa]">{formatDistanceToNow(new Date(post.created_at),{addSuffix:true})}</p></div>
          </div>
          <div className="text-sm text-[#0a0a0a] leading-relaxed" dangerouslySetInnerHTML={{__html:post.body.replace(/\n/g,'<br/>')}}/>
          {post.image_url&&<img src={post.image_url} alt="" className="w-full rounded-xl mt-3 max-h-80 object-cover"/>}
          {post.video_url&&<video src={post.video_url} controls className="w-full mt-3 rounded-xl bg-black max-h-64"/>}
        </div>
        {/* Reactions summary */}
        {(total>0||post.replies>0)&&(
          <div className="flex items-center justify-between px-4 py-2 border-t border-[#f0f0f0]">
            <div className="flex items-center gap-1">{topR.map(r=><span key={r.type} className="text-sm">{r.emoji}</span>)}{total>0&&<span className="text-[11px] text-[#aaa] ml-1">{total}</span>}</div>
            {post.replies>0&&<span className="text-[11px] text-[#aaa]">{post.replies} comment{post.replies!==1?'s':''}</span>}
          </div>
        )}
        {/* Actions */}
        <div className="flex border-t border-[#f0f0f0]">
          <div className="flex-1 relative">
            <button onClick={()=>setPicker(p=>!p)} className="flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-bold hover:bg-[#f9f9f7]" style={{color:myR?myR.color:'#1a6b3a'}}>
              {myR?(<><span key={pulseKey} className="text-lg like-pulse">{myR.emoji}</span><span>{myR.label}</span></>):(<><ThumbsUp className="w-4 h-4" strokeWidth={2.5}/><span>Like</span></>)}
            </button>
            {showPicker&&<ReactionPicker myReaction={myReaction} onReact={handleReact} onClose={()=>setPicker(false)}/>}
          </div>
          <button onClick={()=>document.getElementById('cmt-in')?.focus()} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7] border-x border-[#f0f0f0]"><MessageCircle className="w-4 h-4"/> Comment</button>
          <button onClick={()=>navigator.share?.({text:post.body.replace(/<[^>]*>/g,' ')}).catch(()=>{})} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7]"><Share2 className="w-4 h-4"/> Share</button>
        </div>
        {/* Comments — compressed by default */}
        <div className="border-t border-[#f0f0f0]">
          {comments.length===0&&<p className="text-center text-xs text-[#aaa] py-6">No comments yet. Be first!</p>}
          {!expanded&&comments.length>SHOW&&(
            <button onClick={()=>setExpanded(true)} className="flex items-center gap-1.5 px-4 py-3 text-xs font-bold text-[#1a6b3a] hover:bg-[#f9f9f7] w-full">
              <ChevronDown className="w-3.5 h-3.5"/> View {hidden} more comment{hidden!==1?'s':''}
            </button>
          )}
          {visible.map(c=><CommentItem key={c.id} comment={c} myId={myId} postId={post.id} postAuthorId={post.author_id}/>)}
          {expanded&&comments.length>SHOW&&(
            <button onClick={()=>setExpanded(false)} className="flex items-center gap-1.5 px-4 py-3 text-xs font-bold text-[#6b6b6b] hover:bg-[#f9f9f7] w-full">
              <ChevronUp className="w-3.5 h-3.5"/> Show less
            </button>
          )}
        </div>
      </div>
      <div className="border-t border-[#e8e8e8] bg-white px-3 py-3 flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 bg-[#1a6b3a] rounded-full flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">{av}</div>
        <div className="flex-1 flex items-center border border-[#e8e8e8] rounded-full bg-[#f9f9f7] px-3 py-2 gap-2">
          <input id="cmt-in" value={commentText} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submitComment()} placeholder="Write a comment..." className="flex-1 text-xs outline-none bg-transparent placeholder-[#aaa]"/>
          <button onClick={submitComment} disabled={submitting||!commentText.trim()} className="text-[#1a6b3a] disabled:opacity-30">
            {submitting?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Send className="w-3.5 h-3.5"/>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({post,myReaction,onReact,onClick,myId,onEdit,onDelete}:{post:Post;myReaction?:Reaction;myId:string;onReact:(p:Post,r:Reaction)=>void;onClick:()=>void;onEdit:(p:Post)=>void;onDelete:(p:Post)=>void}) {
  const [showPicker,setPicker]=useState(false)
  const [showMenu,  setMenu]  =useState(false)
  const [pulseKey,  setPulse] =useState(0)
  const total=post.like_count+post.love_count+post.haha_count+post.wow_count+post.cry_count
  const topR=REACTIONS.filter(r=>(post[`${r.type}_count` as keyof Post] as number)>0).sort((a,b)=>(post[`${b.type}_count` as keyof Post] as number)-(post[`${a.type}_count` as keyof Post] as number)).slice(0,3)
  const myR=myReaction?REACTIONS.find(r=>r.type===myReaction):null
  const plain=post.body.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()
  const handleReact=(r:Reaction)=>{setPulse(k=>k+1);setPicker(false);onReact(post,r)}

  return (
    <div className="card animate-fade-in" onClick={()=>{setPicker(false);setMenu(false);onClick()}}>
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
              <button onClick={()=>setMenu(p=>!p)} className="p-1 rounded-full hover:bg-[#f9f9f7] text-[#aaa]"><MoreHorizontal className="w-4 h-4"/></button>
              {showMenu&&<PostMenu post={post} myId={myId} onEdit={()=>onEdit(post)} onDelete={()=>onDelete(post)} onClose={()=>setMenu(false)}/>}
            </div>
          </div>
        </div>
      </div>
      <div className="px-3.5 pb-2">
        <p className="text-sm text-[#0a0a0a] leading-relaxed line-clamp-3">{plain}</p>
        {plain.length>150&&<span className="text-xs text-[#1a6b3a] font-semibold">See more</span>}
      </div>
      {post.image_url&&<div className="mx-3.5 mb-2 rounded-xl overflow-hidden max-h-44"><img src={post.image_url} alt="" className="w-full object-cover max-h-44"/></div>}
      {(total>0||post.replies>0)&&(
        <div className="flex items-center justify-between px-3.5 py-1.5 border-t border-[#f0f0f0]">
          <div className="flex items-center gap-1">{topR.map(r=><span key={r.type} className="text-sm">{r.emoji}</span>)}{total>0&&<span className="text-[10px] text-[#aaa] ml-0.5">{total}</span>}</div>
          {post.replies>0&&<span className="text-[10px] text-[#aaa]">{post.replies} comment{post.replies!==1?'s':''}</span>}
        </div>
      )}
      <div className="flex border-t border-[#f0f0f0]" onClick={e=>e.stopPropagation()}>
        <div className="flex-1 relative">
          <button onClick={()=>setPicker(p=>!p)} className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold hover:bg-[#f9f9f7]" style={{color:myR?myR.color:'#1a6b3a'}}>
            {myR?(<><span key={pulseKey} className="text-base like-pulse">{myR.emoji}</span><span>{myR.label}</span></>):(<><ThumbsUp className="w-4 h-4" strokeWidth={2.5}/><span>Like</span></>)}
          </button>
          {showPicker&&<ReactionPicker myReaction={myReaction} onReact={handleReact} onClose={()=>setPicker(false)}/>}
        </div>
        <button onClick={onClick} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7] border-x border-[#f0f0f0]"><MessageCircle className="w-3.5 h-3.5"/> Comment</button>
        <button onClick={()=>navigator.share?.({text:plain}).catch(()=>{})} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7]"><Share2 className="w-3.5 h-3.5"/> Share</button>
      </div>
    </div>
  )
}

function DeleteConfirm({onConfirm,onCancel}:{onConfirm:()=>void;onCancel:()=>void}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 bg-black/50">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5 text-red-500"/></div>
          <div><p className="font-black text-[#0a0a0a]">Delete Post?</p><p className="text-xs text-[#aaa] mt-0.5">This cannot be undone.</p></div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 rounded-xl text-sm font-semibold text-white">Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function ForumPage() {
  const {student}=useAuth()
  const [posts,  setPosts]  =useState<Post[]>([])
  const [loading,setLoading]=useState(true)
  const [cat,    setCat]    =useState('All')
  const [showCreate,setCreate]=useState(false)
  const [editPost,  setEdit]  =useState<Post|null>(null)
  const [activePost,setActive]=useState<Post|null>(null)
  const [deletePost,setDelete]=useState<Post|null>(null)
  const [myReactions,setReactions]=useState<Record<string,Reaction>>({})
  const myId=student?.idNumber||''

  const loadPosts=useCallback(async()=>{
    setLoading(true)
    let q=supabase.from('forum_posts').select('*').order('created_at',{ascending:false})
    if(cat!=='All') q=q.eq('category',cat)
    const{data}=await q;setPosts((data as Post[])||[]);setLoading(false)
  },[cat])

  useEffect(()=>{loadPosts()},[loadPosts])
  useEffect(()=>{try{const s=localStorage.getItem('forum_reactions');if(s)setReactions(JSON.parse(s))}catch{}
  },[])

  const handleReact=async(post:Post,reaction:Reaction)=>{
    const prev=myReactions[post.id];const next={...myReactions};const upd:any={}
    if(prev===reaction){delete next[post.id];upd[`${reaction}_count`]=Math.max(0,(post[`${reaction}_count` as keyof Post] as number)-1)}
    else{if(prev)upd[`${prev}_count`]=Math.max(0,(post[`${prev}_count` as keyof Post] as number)-1);next[post.id]=reaction;upd[`${reaction}_count`]=((post[`${reaction}_count` as keyof Post] as number)+1)}
    setReactions(next);localStorage.setItem('forum_reactions',JSON.stringify(next))
    setPosts(p=>p.map(x=>x.id===post.id?{...x,...upd}:x))
    if(activePost?.id===post.id)setActive(p=>p?{...p,...upd}:p)
    await supabase.from('forum_posts').update(upd).eq('id',post.id)
  }

  const handleDelete=async()=>{if(!deletePost)return;await supabase.from('forum_posts').delete().eq('id',deletePost.id);setDelete(null);loadPosts()}
  const av=(student?.name||'ST').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)

  return (
    <AppShell>
      <TopBar title="Community" subtitle="Ask questions, share knowledge"/>
      <div className="max-w-2xl mx-auto px-3 lg:px-5 py-4 space-y-3 pb-24 lg:pb-6">
        <div className="card p-3.5">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={()=>setCreate(true)}>
            <div className="w-9 h-9 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">{av}</div>
            <div className="flex-1 bg-[#f9f9f7] rounded-full px-4 py-2.5 hover:bg-[#f0f0f0] transition-colors"><p className="text-[#aaa] text-sm">What's on your mind, {student?.name?.split(' ')[0]}?</p></div>
          </div>
          <div className="flex gap-0 mt-3 pt-3 border-t border-[#e8e8e8]">
            <button onClick={()=>setCreate(true)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7]"><ImageIcon className="w-4 h-4 text-[#1a6b3a]"/> Photo</button>
            <button onClick={()=>setCreate(true)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7]"><Video className="w-4 h-4 text-red-500"/> Video</button>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${cat===c?'bg-[#0a0a0a] text-white':'bg-white border border-[#e8e8e8] text-[#6b6b6b]'}`}>{c}</button>
          ))}
        </div>
        {loading?(
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ):posts.length===0?(
          <div className="card p-10 text-center"><MessageCircle className="w-8 h-8 text-[#ddd] mx-auto mb-3"/><p className="font-semibold text-[#0a0a0a] text-sm">No posts yet</p><button onClick={()=>setCreate(true)} className="btn-primary mt-4 mx-auto">Create Post</button></div>
        ):(
          <div className="space-y-3">
            {posts.map(post=>(
              <PostCard key={post.id} post={post} myReaction={myReactions[post.id]} myId={myId}
                onReact={handleReact} onClick={()=>setActive(post)} onEdit={p=>setEdit(p)} onDelete={p=>setDelete(p)}/>
            ))}
          </div>
        )}
      </div>
      {(showCreate||editPost)&&<PostEditor editPost={editPost||undefined} onClose={()=>{setCreate(false);setEdit(null)}} onSaved={()=>{setCreate(false);setEdit(null);loadPosts()}}/>}
      {activePost&&<PostView post={activePost} myReaction={myReactions[activePost.id]} myId={myId} onReact={handleReact} onClose={()=>setActive(null)}/>}
      {deletePost&&<DeleteConfirm onConfirm={handleDelete} onCancel={()=>setDelete(null)}/>}
    </AppShell>
  )
}
