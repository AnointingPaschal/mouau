'use client'
import { useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { Plus, Trash2, GraduationCap, DollarSign } from 'lucide-react'

type Course = { name:string; unit:string; grade:string }
const GRADE_POINTS:Record<string,number> = {A:5,B:4,C:3,D:2,E:1,F:0}
const GRADES = ['A','B','C','D','E','F']
const FEES = [
  {label:'Development Levy (Fresh students)', amount:80000},
  {label:'School Charges (approximate)',      amount:150000},
  {label:'Accommodation (per session)',        amount:60000},
  {label:'SUG Dues',                          amount:5000},
  {label:'Library Fee',                       amount:3000},
  {label:'Medical Fee',                       amount:5000},
  {label:'Examination Fee',                   amount:10000},
]

function CGPATab() {
  const [courses,   setCourses]   = useState<Course[]>([{name:'',unit:'3',grade:'B'},{name:'',unit:'3',grade:'B'}])
  const [prevGPA,   setPrevGPA]   = useState('')
  const [prevUnits, setPrevUnits] = useState('')
  const add    = () => setCourses(c=>[...c,{name:'',unit:'3',grade:'B'}])
  const remove = (i:number) => setCourses(c=>c.filter((_,j)=>j!==i))
  const update = (i:number,k:keyof Course,v:string) => setCourses(c=>c.map((x,j)=>j===i?{...x,[k]:v}:x))
  const totalUnits  = courses.reduce((s,c)=>s+parseInt(c.unit||'0'),0)
  const totalPoints = courses.reduce((s,c)=>s+(parseInt(c.unit||'0')*(GRADE_POINTS[c.grade]||0)),0)
  const semGPA      = totalUnits>0?(totalPoints/totalUnits).toFixed(2):'0.00'
  const pG=parseFloat(prevGPA||'0'), pU=parseFloat(prevUnits||'0')
  const cgpa = (prevGPA&&prevUnits&&pU>0) ? ((pG*pU+totalPoints)/(pU+totalUnits)).toFixed(2) : semGPA
  const cgpaNum = parseFloat(cgpa)
  const cls  = cgpaNum>=4.5?'First Class':cgpaNum>=3.5?'Second Class Upper':cgpaNum>=2.4?'Second Class Lower':cgpaNum>=1.5?'Third Class':cgpaNum>=1.0?'Pass':'Fail'
  const col  = cgpaNum>=4.5?'#1a6b3a':cgpaNum>=3.5?'#2563eb':cgpaNum>=2.4?'#d97706':'#dc2626'
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <p className="text-xs font-bold text-[#0a0a0a] mb-3">Previous CGPA (optional)</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[10px] text-[#aaa] uppercase tracking-wide">Cumulative GPA</label>
            <input value={prevGPA} onChange={e=>setPrevGPA(e.target.value)} type="number" step="0.01" min="0" max="5" placeholder="e.g. 3.75" className="input mt-1 text-sm"/></div>
          <div><label className="text-[10px] text-[#aaa] uppercase tracking-wide">Total Units Earned</label>
            <input value={prevUnits} onChange={e=>setPrevUnits(e.target.value)} type="number" min="0" placeholder="e.g. 60" className="input mt-1 text-sm"/></div>
        </div>
      </div>
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[#0a0a0a]">This Semester Courses</p>
          <button onClick={add} className="flex items-center gap-1 text-xs text-[#1a6b3a] font-semibold"><Plus className="w-3.5 h-3.5"/> Add</button>
        </div>
        <div className="flex text-[9px] text-[#aaa] px-1 mb-1 gap-2"><span className="flex-1">Course</span><span className="w-12 text-center">Units</span><span className="w-12 text-center">Grade</span><span className="w-6"/></div>
        <div className="space-y-2">
          {courses.map((c,i)=>(
            <div key={i} className="flex items-center gap-2">
              <input value={c.name} onChange={e=>update(i,'name',e.target.value)} placeholder={`Course ${i+1}`} className="input flex-1 text-xs py-2"/>
              <select value={c.unit} onChange={e=>update(i,'unit',e.target.value)} className="input w-12 text-xs py-2 text-center">
                {[1,2,3,4,5,6].map(u=><option key={u}>{u}</option>)}
              </select>
              <select value={c.grade} onChange={e=>update(i,'grade',e.target.value)} className="input w-12 text-xs py-2 text-center font-bold">
                {GRADES.map(g=><option key={g}>{g}</option>)}
              </select>
              <button onClick={()=>remove(i)} className="text-red-400 p-1"><Trash2 className="w-3.5 h-3.5"/></button>
            </div>
          ))}
        </div>
      </div>
      <div className="card p-5 text-center" style={{background:col+'10',borderColor:col+'40',borderWidth:2}}>
        <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{color:col}}>{prevGPA?'Cumulative CGPA':'Semester GPA'}</p>
        <div className="text-5xl font-black mb-1" style={{color:col}}>{cgpa}</div>
        <p className="font-bold text-sm text-[#0a0a0a]">{cls}</p>
        <div className="flex justify-center gap-5 mt-3 text-xs text-[#6b6b6b]">
          <span>Sem GPA: <b>{semGPA}</b></span><span>Units: <b>{totalUnits}</b></span><span>Points: <b>{totalPoints}</b></span>
        </div>
      </div>
      <div className="card p-3 space-y-1">
        <p className="text-[10px] font-bold text-[#0a0a0a] mb-1">MOUAU Grading Scale</p>
        {[['A','5.0','70-100','#1a6b3a'],['B','4.0','60-69','#2563eb'],['C','3.0','50-59','#d97706'],['D','2.0','45-49','#d97706'],['E','1.0','40-44','#dc2626'],['F','0.0','0-39','#dc2626']].map(r=>(
          <div key={r[0]} className="flex justify-between text-xs">
            <span className="font-black w-5" style={{color:r[3]}}>{r[0]}</span>
            <span className="text-[#6b6b6b]">{r[1]} pts</span>
            <span className="text-[#6b6b6b]">{r[2]}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeesTab() {
  const [sel, setSel] = useState<Record<string,boolean>>({})
  const toggle=(k:string)=>setSel(p=>({...p,[k]:!p[k]}))
  const total=FEES.filter(f=>sel[f.label]).reduce((s,f)=>s+f.amount,0)
  return (
    <div className="space-y-3">
      <div className="card p-4">
        <p className="text-xs font-bold text-[#0a0a0a] mb-1">MOUAU Fee Estimator 2024/2025</p>
        <p className="text-[10px] text-[#aaa] mb-3">Tick applicable fees to estimate your total payment.</p>
        <div className="space-y-2">
          {FEES.map(f=>(
            <div key={f.label} onClick={()=>toggle(f.label)}
              className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${sel[f.label]?'border-[#1a6b3a] bg-[#f0f9f4]':'border-[#e8e8e8]'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${sel[f.label]?'bg-[#1a6b3a] border-[#1a6b3a]':'border-[#ccc]'}`} style={{width:18,height:18}}>
                  {sel[f.label]&&<svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="text-xs font-medium text-[#0a0a0a]">{f.label}</span>
              </div>
              <span className="text-xs font-bold text-[#0a0a0a] flex-shrink-0 ml-2">₦{f.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      {total>0&&(
        <div className="card p-5 text-center bg-[#1a6b3a]/5 border-2 border-[#1a6b3a]/30">
          <p className="text-[10px] uppercase tracking-widest text-[#1a6b3a] font-bold mb-1">Estimated Total</p>
          <div className="text-4xl font-black text-[#1a6b3a]">₦{total.toLocaleString()}</div>
          <p className="text-[10px] text-[#aaa] mt-1">Confirm exact amounts at the bursary or portal</p>
        </div>
      )}
    </div>
  )
}

export default function CalculatorPage() {
  const [tab, setTab] = useState<'cgpa'|'fees'>('cgpa')
  return (
    <AppShell>
      <TopBar title="Calculator" subtitle="CGPA and fee estimator"/>
      <div className="max-w-lg mx-auto p-4 pb-24 space-y-4">
        <div className="flex bg-[#f9f9f7] rounded-xl p-1 gap-1">
          {([['cgpa','CGPA Calculator',GraduationCap],['fees','Fee Estimator',DollarSign]] as [string,string,any][]).map(([t,l,Icon])=>(
            <button key={t} onClick={()=>setTab(t as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${tab===t?'bg-white text-[#0a0a0a] shadow-sm':'text-[#aaa]'}`}>
              <Icon className="w-3.5 h-3.5"/>{l}
            </button>
          ))}
        </div>
        {tab==='cgpa'?<CGPATab/>:<FeesTab/>}
      </div>
    </AppShell>
  )
}
