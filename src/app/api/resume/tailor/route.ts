import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { tailorResumeToJob, type ResumeData } from '@/lib/ai/resume'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json()
    const { resumeData, jobDescription } = body as {
      resumeData: ResumeData
      jobDescription: string
    }

    if (!resumeData || !jobDescription?.trim()) {
      return NextResponse.json(
        { error: 'resumeData and jobDescription are required' },
        { status: 400 },
      )
    }

    // Run AI tailoring
    const { tailoredResume, changes } = await tailorResumeToJob(resumeData, jobDescription)

    // Save as new version (never overwrites original)
    const version = await db.resumeVersion.create({
      data: {
        userId,
        originalResume: resumeData as never,
        tailoredResume: tailoredResume as never,
        jobDescription,
        label: `Tailored — ${new Date().toLocaleDateString()}`,
      },
    })

    return NextResponse.json({
      versionId: version.id,
      tailoredResume,
      changes,
    })
  } catch (error) {
    console.error('Resume tailor error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Tailoring failed' },
      { status: 500 },
    )
  }
}
