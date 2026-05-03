import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import {
  scoreATSHeuristic,
  enhanceATSWithAI,
  resumeDataToText,
  type ResumeData,
} from '@/lib/ai/resume'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { resumeText, resumeData, jobDescription } = body as {
      resumeText?: string
      resumeData?: ResumeData
      jobDescription?: string
    }

    // Accept either raw text or structured data
    const text = resumeText ?? (resumeData ? resumeDataToText(resumeData) : '')

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Either resumeText or resumeData is required' },
        { status: 400 },
      )
    }

    // Step 1: fast heuristic pass
    const heuristic = scoreATSHeuristic(text, jobDescription)

    // Step 2: AI enhancement (blended with heuristic for reliability)
    const result = await enhanceATSWithAI(text, heuristic, jobDescription)

    return NextResponse.json(result)
  } catch (error) {
    console.error('ATS score error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scoring failed' },
      { status: 500 },
    )
  }
}
