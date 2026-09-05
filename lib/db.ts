import { supabase, supabaseConfigured } from './supabase'

// ── Library Materials ────────────────────────────────────────────
export async function getLibraryItems(filters?: {
  query?: string; college?: string; level?: string; type?: string; sort?: string
}) {
  if (!supabaseConfigured) return { data: [], error: null }
  let q = supabase.from('library_materials').select('*')
  if (filters?.query) q = q.or(`title.ilike.%${filters.query}%,course_code.ilike.%${filters.query}%,department.ilike.%${filters.query}%`)
  if (filters?.college && filters.college !== 'all') q = q.eq('college', filters.college)
  if (filters?.level && filters.level !== 'all') q = q.eq('level', filters.level)
  if (filters?.type && filters.type !== 'all') q = q.eq('type', filters.type)
  if (filters?.sort === 'rating') q = q.order('rating', { ascending: false })
  else if (filters?.sort === 'date') q = q.order('created_at', { ascending: false })
  else q = q.order('downloads', { ascending: false })
  return q
}

export async function uploadMaterial(file: File, metadata: {
  title: string; department: string; college: string; level: string
  type: string; course: string; courseCode: string; uploader: string; year?: string
}) {
  if (!supabaseConfigured) return { error: 'Database not configured' }
  const ext = file.name.split('.').pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error: uploadError } = await supabase.storage.from('materials').upload(path, file, { upsert: false })
  if (uploadError) return { error: uploadError.message }
  const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path)
  const sizeMB = (file.size / 1024 / 1024).toFixed(1)
  const { error: dbError } = await supabase.from('library_materials').insert({
    title: metadata.title, department: metadata.department, college: metadata.college,
    level: metadata.level, type: metadata.type, course: metadata.course,
    course_code: metadata.courseCode, uploader: metadata.uploader,
    year: metadata.year || null, file_url: publicUrl,
    size: `${sizeMB} MB`, downloads: 0, rating: 0, verified: false
  })
  return { error: dbError?.message || null }
}

export async function incrementDownload(id: string, current: number) {
  if (!supabaseConfigured) return
  await supabase.from('library_materials').update({ downloads: current + 1 }).eq('id', id)
}

// ── Forum Posts ──────────────────────────────────────────────────
export async function getForumPosts(category?: string) {
  if (!supabaseConfigured) return { data: [], error: null }
  let q = supabase.from('forum_posts').select('*').order('created_at', { ascending: false })
  if (category && category !== 'All') q = q.eq('category', category)
  return q
}

export async function createForumPost(post: {
  title: string; body: string; author: string; avatar: string
  category: string; tags: string[]
}) {
  if (!supabaseConfigured) return { error: 'Database not configured' }
  return supabase.from('forum_posts').insert({
    ...post, replies: 0, views: 0, likes: 0, answered: false
  })
}

export async function likePost(id: string, current: number) {
  if (!supabaseConfigured) return
  await supabase.from('forum_posts').update({ likes: current + 1 }).eq('id', id)
}

// ── Announcements ────────────────────────────────────────────────
export async function getAnnouncements() {
  if (!supabaseConfigured) return { data: [], error: null }
  return supabase.from('announcements').select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)
}
