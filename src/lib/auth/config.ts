import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const SECRET =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  'dev-fallback-secret-change-in-production-32chars'

// Admin phone number (stored without country code prefix in DB, but we normalise)
const ADMIN_PHONE = '917897671348' // +91 7897671348

export const authConfig: NextAuthConfig = {
  secret: SECRET,
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        phone:    { label: 'Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null

        const normalised = normalisePhone(credentials.phone as string)
        if (!normalised) return null

        const user = await db.user.findUnique({
          where: { phone: normalised },
        })

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!valid) return null

        return {
          id:        user.id,
          email:     user.email ?? user.phone ?? '',
          name:      user.name,
          plan:      user.plan,
          role:      user.role,
          username:  user.username ?? undefined,
          onboarded: user.onboarded,
          phone:     user.phone ?? undefined,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id        = user.id
        token.plan      = (user as { plan?: string }).plan      ?? 'FREE'
        token.role      = (user as { role?: string }).role      ?? 'USER'
        token.username  = (user as { username?: string }).username
        token.onboarded = (user as { onboarded?: boolean }).onboarded ?? true
        token.phone     = (user as { phone?: string }).phone
        return token
      }

      const now = Date.now()
      const lastRefresh = (token.lastDbRefresh as number) ?? 0
      const FIVE_MINUTES = 5 * 60 * 1000

      if (trigger === 'update' || (now - lastRefresh > FIVE_MINUTES)) {
        if (token.id) {
          try {
            const dbUser = await db.user.findUnique({
              where: { id: token.id as string },
              select: { plan: true, role: true, username: true, onboarded: true, phone: true },
            })
            if (dbUser) {
              token.plan          = dbUser.plan
              token.role          = dbUser.role
              token.username      = dbUser.username ?? undefined
              token.onboarded     = dbUser.onboarded
              token.phone         = dbUser.phone ?? undefined
              token.lastDbRefresh = now
            }
          } catch (e) {
            console.error('[auth] DB refresh failed:', e)
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id        = token.id        as string
        session.user.plan      = token.plan      as string
        session.user.role      = token.role      as string
        session.user.username  = token.username  as string | undefined
        session.user.onboarded = token.onboarded as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

/** Normalise Indian mobile → 12-digit string e.g. "917897671348" */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  // Accept 10-digit Indian numbers or already-prefixed 12-digit
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return digits
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`
  return null
}

export { ADMIN_PHONE }
