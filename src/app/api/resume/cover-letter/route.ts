import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { generateCoverLetter, type ResumeData } from '@/lib/ai/resume'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json()
    const { resumeData, jobDescription, tone, versionId } = body as {
      resumeData: ResumeData
      jobDescription: string
      tone?: 'professional' | 'casual' | 'executive' | 'creative'
      versionId?: string   // optional — attach to existing version
    }

    if (!resumeData || !jobDescription?.trim()) {
      return NextResponse.json(
        { error: 'resumeData and jobDescription are required' },
        { status: 400 },
      )
    }

    const coverLetter = await generateCoverLetter(
      resumeData,
      jobDescription,
      tone ?? 'professional',
    )

    // Attach to existing version or create a new one
    let savedVersionId = versionId
    if (versionId) {
      await db.resumeVersion.update({
        where: { id: versionId, userId },
        data: { coverLetter, tone: tone ?? 'professional' },
      })
    } else {
      const version = await db.resumeVersion.create({
        data: {
          userId,
          originalResume: resumeData as never,
          jobDescription,
          coverLetter,
          tone: tone ?? 'professional',
          label: `Cover Letter — ${new Date().toLocaleDateString()}`,
        },
      })
      savedVersionId = version.id
    }

    return NextResponse.json({ coverLetter, versionId: savedVersionId })
  } catch (error) {
    console.error('Cover letter error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    )
  }
}
