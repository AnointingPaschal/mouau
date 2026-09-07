'use client'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { Phone, Shield, Flame, Heart, AlertTriangle, MapPin, Info } from 'lucide-react'

const CONTACTS = [
  { category:'Campus Security', icon:'🛡️', items:[
    { name:'Security Control Room', number:'08033444455', note:'24/7 campus security' },
    { name:'Gate 1 Security',       number:'08035678901', note:'Main gate security post' },
    { name:'Student Affairs Office',number:'08037890123', note:'For student emergencies' },
  ]},
  { category:'Health & Medical', icon:'🏥', items:[
    { name:'University Health Centre', number:'08031234567', note:'Campus clinic - 24hrs' },
    { name:'Health Centre Ambulance', number:'08039876543', note:'Campus emergency transport' },
    { name:'Federal Medical Centre Umuahia', number:'088-220123', note:'Nearest major hospital' },
  ]},
  { category:'Fire & Rescue', icon:'🚒', items:[
    { name:'Umuahia Fire Service', number:'08034567890', note:'State fire service' },
    { name:'Campus Maintenance',   number:'08036789012', note:'Electrical/infrastructure emergencies' },
  ]},
  { category:'Police', icon:'👮', items:[
    { name:'Umuahia Police Command', number:'08037654321', note:'State police headquarters' },
    { name:'NPF Emergency Line',     number:'112',        note:'National emergency number' },
  ]},
  { category:'University Offices', icon:'🏛️', items:[
    { name:'Vice Chancellor Office',  number:'08031111111', note:'VC office line' },
    { name:'Registry',                number:'08032222222', note:'Student records & admin' },
    { name:'ICT Centre (Portal Help)',number:'08033333333', note:'For portal/registration issues' },
    { name:'Students Affairs',        number:'08034444444', note:'General student welfare' },
    { name:'Bursary',                 number:'08035555555', note:'Fees & payments' },
  ]},
  { category:'Transport & Logistics', icon:'🚗', items:[
    { name:'Campus Bus Service', number:'08038888888', note:'Scheduled campus routes' },
    { name:'Estate Transport',   number:'08039999999', note:'External transport coordination' },
  ]},
]

const TIPS = [
  'Save these numbers to your contacts NOW — you may not have signal to search later',
  'The campus health centre is open 24 hours for emergencies',
  'For sexual assault or GBV, contact Students Affairs for confidential support',
  'Keep your student ID card on you at all times on campus',
  'In case of fire: sound the alarm first, evacuate, then call the fire service',
  'Identify the nearest clinic/pharmacy to your hostel as soon as you arrive',
]

export default function EmergencyPage() {
  return (
    <AppShell>
      <TopBar title="Emergency Contacts" subtitle="Important campus numbers"/>
      <div className="pb-24 lg:pb-6 w-full">
        {/* Alert banner */}
        <div className="mx-4 mt-4 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="font-bold text-red-700 text-sm">Life-threatening emergency?</p>
            <p className="text-xs text-red-600 mt-0.5">Call <strong>112</strong> (national emergency) or campus security immediately</p>
            <a href="tel:112" className="mt-2 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-xl w-fit">
              <Phone className="w-3.5 h-3.5"/> Call 112 Now
            </a>
          </div>
        </div>

        {/* Contact sections */}
        <div className="px-4 mt-4 space-y-4">
          {CONTACTS.map(section => (
            <div key={section.category}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{section.icon}</span>
                <p className="section-label">{section.category.toUpperCase()}</p>
              </div>
              <div className="card divide-y divide-[#f0f0f0]">
                {section.items.map(contact => (
                  <div key={contact.name} className="flex items-center gap-3 p-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0a0a0a] text-sm">{contact.name}</p>
                      <p className="text-[10px] text-[#aaa] mt-0.5">{contact.note}</p>
                    </div>
                    <a href={`tel:${contact.number}`}
                      className="flex items-center gap-1.5 bg-[#1a6b3a] text-white text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0 active:scale-95 transition-all">
                      <Phone className="w-3 h-3"/> {contact.number}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Safety tips */}
        <div className="px-4 mt-5">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-[#1a6b3a]"/>
            <p className="section-label">SAFETY TIPS</p>
          </div>
          <div className="card p-4 space-y-2.5">
            {TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#1a6b3a]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[9px] font-black text-[#1a6b3a]">{i+1}</span>
                </div>
                <p className="text-xs text-[#6b6b6b] leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
