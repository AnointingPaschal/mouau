import { NextRequest, NextResponse } from 'next/server'
import { getAITrainingContext, getCampusContext } from '@/lib/db'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const MODELS = [
  'google/gemma-4-31b-it:free',
  'liquid/lfm-2.5-2.6b:free',
  'z-ai/glm-5.2:free',
  'thinkingmachines/inkling:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'minimax/minimax-m2.7:free',
]

function cleanResponse(text: string): string {
  return text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '- ')
    .replace(/^\s*\d+\.\s+/gm, (m) => m.trim() + ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const [trainingContext, campusContext] = await Promise.all([
      getAITrainingContext(),
      getCampusContext()
    ])

    const systemPrompt = `You are MOUAU Assistant, the official AI guide for Michael Okpara University of Agriculture, Umudike (MOUAU), Abia State, Nigeria.

You help students — especially fresh students — with registration, campus navigation, academic information, and campus life.

IMPORTANT FORMATTING RULES:
- Write in plain, clean text only. No markdown, no asterisks, no hash symbols, no special characters.
- Use numbered lists (1. 2. 3.) for steps.
- Use simple dashes (- ) for bullet points only when needed.
- Keep responses concise and friendly.
- Start responses directly without preamble.

CAMPUS LOCATIONS:
${campusContext}

${trainingContext ? `ADDITIONAL KNOWLEDGE:\n${trainingContext}` : ''}

General facts:
- MOUAU established 1992, located in Umudike, 8km from Umuahia, Abia State
- Portal: mouau.edu.ng | ICT Centre: +234 902 434 8507
- School fees paid via Remita (generate RRR from portal)
- Fresh students use JAMB number as default portal username
- Library: Mon-Fri 9AM-6PM, Sat 9AM-4PM
- Health Centre: 24-hour emergency care`

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
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
            max_tokens: 700,
            temperature: 0.5
          })
        })
        if (response.ok) {
          const data = await response.json()
          const raw = data.choices?.[0]?.message?.content
          if (raw) return NextResponse.json({ content: cleanResponse(raw), model })
        }
      } catch { continue }
    }

    return NextResponse.json({ content: 'I am having trouble connecting right now. Please try again in a moment, or visit the MOUAU ICT Centre for assistance.', model: 'fallback' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
