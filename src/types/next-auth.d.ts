import type { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id:        string
      plan:      string
      role:      string
      username?: string
      onboarded: boolean
      phone?:    string
    } & DefaultSession['user']
  }

  interface User {
    plan?:      string
    role?:      string
    username?:  string
    onboarded?: boolean
    phone?:     string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?:            string
    plan?:          string
    role?:          string
    username?:      string
    onboarded?:     boolean
    lastDbRefresh?: number
    phone?:         string
  }
}
