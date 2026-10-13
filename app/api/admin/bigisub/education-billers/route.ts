import { NextResponse } from 'next/server'
import { EDUCATION_EXAMS } from '@/lib/bigisub'

// No v2 list endpoint exists for education exams — return static list
export async function GET() {
  return NextResponse.json({ billers: EDUCATION_EXAMS })
}
