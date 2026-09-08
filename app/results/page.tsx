'use client'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'
import { TrendingUp, ArrowRight } from 'lucide-react'

export default function ResultsPage() {
  const { student } = useAuth()
  return (
    <AppShell>
      <TopBar title="Results" subtitle="Your academic results log" />
      <div className="p-4 lg:p-6 pb-24 max-w-xl space-y-4">
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 text-center">
          <div className="w-14 h-14 bg-[#7c3aed]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-7 h-7 text-[#7c3aed]" />
          </div>
          <h2 className="font-black text-[#0a0a0a] text-lg mb-2">Results via CGPA Tracker</h2>
          <p className="text-[#6b6b6b] text-sm leading-relaxed mb-5">
            Your academic results are tracked through the CGPA calculator. Enter your courses and grades per semester to view your cumulative performance.
          </p>
          <Link href="/cgpa" className="inline-flex items-center gap-2 bg-[#7c3aed] text-white font-bold px-5 py-3 rounded-xl text-sm hover:bg-[#6d28d9] transition-colors">
            Open CGPA Tracker <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="bg-[#f9f9f7] border border-[#e8e8e8] rounded-xl p-4">
          <p className="text-xs font-semibold text-[#0a0a0a] mb-1">📋 How it works</p>
          <ul className="text-xs text-[#6b6b6b] space-y-1.5 leading-relaxed">
            <li>• Go to CGPA Tracker and add each semester</li>
            <li>• Enter your courses: code, units, and grade (A–F)</li>
            <li>• Your GPA and CGPA are calculated automatically</li>
            <li>• All data is saved to your account</li>
          </ul>
        </div>
      </div>
    </AppShell>
  )
}
