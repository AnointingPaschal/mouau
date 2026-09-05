import { supabase, supabaseConfigured } from './supabase'

// ── Library ──────────────────────────────────────────────────
export async function getLibraryItems(filters?: { query?: string; college?: string; level?: string; type?: string; sort?: string }) {
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

export async function uploadMaterial(file: File, meta: { title: string; department: string; college: string; level: string; type: string; course: string; courseCode: string; uploader: string; abstract?: string; year?: string; studentId?: string }) {
  if (!supabaseConfigured) return { error: 'Database not configured' }
  const ext = file.name.split('.').pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error: uploadErr } = await supabase.storage.from('materials').upload(path, file)
  if (uploadErr) return { error: uploadErr.message }
  const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path)
  const size = `${(file.size / 1024 / 1024).toFixed(1)} MB`
  const { error } = await supabase.from('library_materials').insert({
    title: meta.title, department: meta.department, college: meta.college,
    level: meta.level, type: meta.type, course: meta.course,
    course_code: meta.courseCode, uploader: meta.uploader,
    abstract: meta.abstract || '', year: meta.year || '',
    student_id: meta.studentId || '', file_url: publicUrl, size,
    downloads: 0, rating: 0, verified: false, admin_only: false
  })
  return { error: error?.message || null }
}

export async function incrementDownload(id: string, current: number) {
  if (!supabaseConfigured) return
  await supabase.from('library_materials').update({ downloads: current + 1 }).eq('id', id)
}

// ── Forum ────────────────────────────────────────────────────
export async function getForumPosts(category?: string) {
  if (!supabaseConfigured) return { data: [], error: null }
  let q = supabase.from('forum_posts').select('*').order('created_at', { ascending: false })
  if (category && category !== 'All') q = q.eq('category', category)
  return q
}

export async function createForumPost(post: { title: string; body: string; author: string; avatar: string; category: string; tags: string[] }) {
  if (!supabaseConfigured) return { error: 'Not configured' }
  return supabase.from('forum_posts').insert({ ...post, replies: 0, views: 0, likes: 0, answered: false })
}

export async function likePost(id: string, current: number) {
  if (!supabaseConfigured) return
  await supabase.from('forum_posts').update({ likes: current + 1 }).eq('id', id)
}

// ── Announcements ────────────────────────────────────────────
export async function getAnnouncements() {
  if (!supabaseConfigured) return { data: [], error: null }
  return supabase.from('announcements').select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)
}

// ── Site content ─────────────────────────────────────────────
export async function getSiteContent() {
  if (!supabaseConfigured) return {}
  const { data } = await supabase.from('site_content').select('key,value')
  if (!data) return {}
  return Object.fromEntries(data.map(d => [d.key, d.value])) as Record<string, string>
}

// ── Campus locations (from DB) ───────────────────────────────
export async function getCampusLocations() {
  if (!supabaseConfigured) return { data: [], error: null }
  return supabase.from('campus_locations').select('*').order('sort_order')
}

// ── AI training context ───────────────────────────────────────
export async function getAITrainingContext() {
  if (!supabaseConfigured) return ''
  const { data } = await supabase.from('ai_training').select('question,answer').eq('active', true)
  if (!data || data.length === 0) return ''
  return data.map(d => `Q: ${d.question}\nA: ${d.answer}`).join('\n\n')
}

export async function getCampusContext() {
  if (!supabaseConfigured) return ''
  const { data } = await supabase.from('campus_locations').select('name,description,directions,hours,category')
  if (!data || data.length === 0) return ''
  return data.map(d => `${d.name} (${d.category}): ${d.description}. Directions: ${d.directions}${d.hours ? `. Hours: ${d.hours}` : ''}`).join('\n')
}

// ── Students ─────────────────────────────────────────────────
export async function upsertStudent(student: { id_number: string; name: string; email?: string; whatsapp?: string }) {
  if (!supabaseConfigured) return { error: null }
  return supabase.from('students').upsert({
    id_number: student.id_number, name: student.name,
    email: student.email || '', whatsapp: student.whatsapp || ''
  }, { onConflict: 'id_number' })
}
