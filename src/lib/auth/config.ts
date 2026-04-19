import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authConfig: NextAuthConfig = {
  // NextAuth v5 reads AUTH_SECRET; keep NEXTAUTH_SECRET as fallback for Render
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!valid) return null

        return {
          id:        user.id,
          email:     user.email,
          name:      user.name,
          plan:      user.plan,
          role:      user.role,
          username:  user.username ?? undefined,
          onboarded: user.onboarded,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign-in: seed token from the authorized user object
      if (user) {
        token.id        = user.id
        token.plan      = (user as { plan?: string }).plan      ?? 'FREE'
        token.role      = (user as { role?: string }).role      ?? 'USER'
        token.username  = (user as { username?: string }).username
        token.onboarded = (user as { onboarded?: boolean }).onboarded ?? false
        return token
      }

      // On explicit session update (e.g. after plan upgrade via router.refresh())
      // OR every 5 minutes to keep plan/onboarded fresh without hitting DB on every request
      const now = Date.now()
      const lastRefresh = (token.lastDbRefresh as number) ?? 0
      const FIVE_MINUTES = 5 * 60 * 1000

      if (trigger === 'update' || (now - lastRefresh > FIVE_MINUTES)) {
        if (token.id) {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { plan: true, role: true, username: true, onboarded: true },
          })
          if (dbUser) {
            token.plan          = dbUser.plan
            token.role          = dbUser.role
            token.username      = dbUser.username ?? undefined
            token.onboarded     = dbUser.onboarded
            token.lastDbRefresh = now
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
