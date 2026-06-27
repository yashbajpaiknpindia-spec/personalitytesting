/**
 * Edge-safe auth config, NO bcryptjs, NO db imports.
 * Used ONLY by src/middleware.ts (runs on Edge Runtime).
 * The full config with bcryptjs + Prisma stays in config.ts.
 */
import NextAuth, { type NextAuthConfig } from 'next-auth'

const SECRET =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  'dev-fallback-secret-change-in-production-32chars'

export const edgeAuthConfig: NextAuthConfig = {
  secret: SECRET,
  trustHost: true,
  providers: [],          // no Credentials here, bcryptjs is Node.js only
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token }) { return token },
    session({ session, token }) {
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
  pages: { signIn: '/login' },
}

export const { auth: edgeAuth } = NextAuth(edgeAuthConfig)
