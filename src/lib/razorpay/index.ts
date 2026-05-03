import Razorpay from 'razorpay'

export function getRazorpay() {
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

// Plan → amount in paise (INR). Adjust as needed.
// PRO: ₹1,599/mo (~$19),  TEAM: ₹4,099/mo (~$49)
export const PLAN_AMOUNTS: Record<string, { amount: number; currency: string; planName: string }> = {
  PRO:  { amount: 159900, currency: 'INR', planName: 'Pro'  },
  TEAM: { amount: 409900, currency: 'INR', planName: 'Team' },
}

export function planFromNotes(notes: Record<string, string>): 'PRO' | 'TEAM' | 'FREE' {
  const plan = notes?.plan
  if (plan === 'PRO')  return 'PRO'
  if (plan === 'TEAM') return 'TEAM'
  return 'FREE'
}
