import { NextRequest, NextResponse } from 'next/server'

// Set OPENROUTER_API_KEY in your Vercel project environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''

const MODELS = [
  'google/gemma-4-31b-it:free',
  'liquid/lfm-2.5-2.6b:free',
  'z-ai/glm-5.2:free',
  'thinkingmachines/inkling:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'minimax/minimax-m2.7:free',
]

const SYSTEM_PROMPT = `You are MOUAU Assistant, the official AI guide for Michael Okpara University of Agriculture, Umudike (MOUAU), Abia State, Nigeria.

You help students — especially fresh students (freshers) — with:
- Campus navigation and finding buildings/offices
- Registration process (JAMB verification, school fees via Remita, course registration, departmental clearance)
- Academic information (course codes, departments, colleges, grading system)
- Campus life (hostels, cafeteria, library, sports, clubs)
- Study tips and exam preparation
- General university policies and procedures

Key facts:
- MOUAU was established in 1992, located in Umudike, ~8km from Umuahia, Abia State
- Colleges: Agriculture, Natural Sciences, Engineering, Food Sciences, Veterinary Medicine, Management Sciences
- Portal: mouau.edu.ng | Phone: +234 902 434 8507
- School fees are paid via Remita (generate RRR from the portal)
- Fresh students use their JAMB number as default portal username
- Library hours: Mon-Fri 9AM-6PM, Sat 9AM-4PM
- Health Centre: 24-hour emergency care
- ICT Centre handles portal issues and student ID cards

Keep responses helpful, friendly, concise and encouraging. Use bullet points for lists. Always greet students warmly.
If you don't know something specific, say so and direct them to the Admin Block or ICT Centre.`

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({
      content: "AI Assistant is not configured yet. Please contact the administrator to set up the OPENROUTER_API_KEY environment variable in Vercel.",
      model: 'none'
    })
  }

  try {
    const { messages } = await req.json()

    for (const model of MODELS) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://mouau-freshstart.vercel.app',
            'X-Title': 'MOUAU FreshStart'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...messages
            ],
            max_tokens: 800,
            temperature: 0.7
          })
        })

        if (response.ok) {
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content
          if (content) {
            return NextResponse.json({ content, model })
          }
        }
      } catch (err) {
        console.error(`Model ${model} failed:`, err)
        continue
      }
    }

    return NextResponse.json({
      content: "I'm having trouble connecting right now. Please try again in a moment, or visit the MOUAU ICT Centre for direct assistance.",
      model: 'fallback'
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
