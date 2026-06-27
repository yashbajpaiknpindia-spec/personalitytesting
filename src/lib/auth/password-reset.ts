import crypto from 'crypto'

const SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'dev-fallback-secret-change-in-production-32chars'

const TOKEN_TTL_MS = 30 * 60 * 1000

type ResetPayload = {
  uid: string
  phone: string
  exp: number
  pwd: string
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url')
}

function sign(value: string) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('base64url')
}

function passwordFingerprint(passwordHash: string | null | undefined) {
  return crypto
    .createHash('sha256')
    .update(passwordHash || 'no-password-yet')
    .digest('base64url')
    .slice(0, 18)
}

export function getStrictIndianMobileDigits(raw: unknown): string | null {
  const value = String(raw ?? '').trim()
  if (!/^\d{10}$/.test(value)) return null
  if (!/^[6-9]\d{9}$/.test(value)) return null
  return value
}

export function toStoredIndianPhone(localDigits: string) {
  return `91${localDigits}`
}

export function createPasswordResetToken(input: {
  userId: string
  phone: string
  passwordHash?: string | null
}) {
  const payload: ResetPayload = {
    uid: input.userId,
    phone: input.phone,
    exp: Date.now() + TOKEN_TTL_MS,
    pwd: passwordFingerprint(input.passwordHash),
  }

  const encoded = base64url(JSON.stringify(payload))
  return `${encoded}.${sign(encoded)}`
}

export function verifyPasswordResetToken(token: unknown, passwordHash?: string | null):
  | { valid: true; userId: string; phone: string }
  | { valid: false; reason: string } {
  const value = String(token ?? '').trim()
  const [encoded, signature] = value.split('.')
  if (!encoded || !signature) return { valid: false, reason: 'Invalid reset link.' }

  const expected = sign(encoded)
  const safeA = Buffer.from(signature)
  const safeB = Buffer.from(expected)
  if (safeA.length !== safeB.length || !crypto.timingSafeEqual(safeA, safeB)) {
    return { valid: false, reason: 'Invalid reset link.' }
  }

  let payload: ResetPayload
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as ResetPayload
  } catch {
    return { valid: false, reason: 'Invalid reset link.' }
  }

  if (!payload.uid || !payload.phone || !payload.exp || !payload.pwd) {
    return { valid: false, reason: 'Invalid reset link.' }
  }

  if (Date.now() > payload.exp) {
    return { valid: false, reason: 'This reset link has expired. Please request a fresh link.' }
  }

  if (payload.pwd !== passwordFingerprint(passwordHash)) {
    return { valid: false, reason: 'This reset link has already been used or is no longer valid.' }
  }

  return { valid: true, userId: payload.uid, phone: payload.phone }
}
