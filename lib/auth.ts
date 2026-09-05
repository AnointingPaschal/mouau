export type Student = {
  id: string
  name: string
  idNumber: string
  department: string
  college: string
  level: string
  email: string
  phone: string
  avatar: string
  registrationProgress: number
  points: number
  downloads: number
}

const DEFAULT_STUDENT: Student = {
  id: '1',
  name: 'Student',
  idNumber: '',
  department: '',
  college: '',
  level: '100',
  email: '',
  phone: '',
  avatar: '',
  registrationProgress: 0,
  points: 0,
  downloads: 0
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

export function login(idNumber: string, name?: string): Student {
  const existing = getStudent()
  if (existing && existing.idNumber === idNumber) {
    return existing
  }
  const initials = (name || 'Student').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)
  const student: Student = {
    ...DEFAULT_STUDENT,
    id: Date.now().toString(),
    name: name || 'MOUAU Student',
    idNumber,
    avatar: initials,
    email: `${idNumber.toLowerCase()}@student.mouau.edu.ng`
  }
  saveStudent(student)
  return student
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
