export type StudentType = 'fresher' | 'returning'

export type Student = {
  id: string
  name: string
  idNumber: string       // primary login key (JAMB for freshers, matric for returning)
  studentType: StudentType
  jambNumber: string     // JAMB reg number (freshers always have this)
  matricNumber: string   // matric number (freshers get it later, returning always have it)
  department: string
  college: string
  level: string
  email: string
  whatsapp: string
  avatar: string
  points: number
  downloads: number
}

export function getStudent(): Student | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('mouau_student')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveStudent(student: Student): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('mouau_student', JSON.stringify(student))
}

export function logout(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('mouau_student')
}

export function updateStudent(updates: Partial<Student>): Student | null {
  const student = getStudent()
  if (!student) return null
  const updated = { ...student, ...updates }
  saveStudent(updated)
  return updated
}

export function getRegistrationProgress(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem('mouau_reg_progress')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function saveRegistrationProgress(progress: Record<string, boolean>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('mouau_reg_progress', JSON.stringify(progress))
}

export function getDownloadHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('mouau_downloads')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function addDownload(itemId: string): void {
  if (typeof window === 'undefined') return
  const history = getDownloadHistory()
  if (!history.includes(itemId)) {
    history.push(itemId)
    localStorage.setItem('mouau_downloads', JSON.stringify(history))
  }
}
