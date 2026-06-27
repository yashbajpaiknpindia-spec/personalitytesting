import { handlers } from '@/lib/auth/config'

export const { GET, POST } = handlers

// Ensure this runs on the Node.js runtime (bcryptjs + Prisma are not Edge-safe)
export const runtime = 'nodejs'
