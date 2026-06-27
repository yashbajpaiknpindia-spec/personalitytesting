import Razorpay from 'razorpay'

export type AccountPlan = 'FREE' | 'PRO' | 'TEAM'

export function getRazorpay() {
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

// Plan → amount in paise (INR).
// The UI uses the newer package ids below. PRO/TEAM are kept for backward compatibility.
export const PLAN_AMOUNTS: Record<string, { amount: number; currency: string; planName: string; accountPlan: AccountPlan }> = {
  AI_CREATOR_1000:         { amount: 100000,  currency: 'INR', planName: 'Creator',       accountPlan: 'PRO'  },
  BUSINESS_PRO_5000:       { amount: 500000,  currency: 'INR', planName: 'Business Pro',     accountPlan: 'TEAM' },
  UNLIMITED_GROWTH_10000:  { amount: 1000000, currency: 'INR', planName: 'Growth Suite', accountPlan: 'TEAM' },

  // Legacy ids used by older billing screens/routes.
  PRO:  { amount: 100000,  currency: 'INR', planName: 'Creator',       accountPlan: 'PRO'  },
  TEAM: { amount: 1000000, currency: 'INR', planName: 'Growth Suite', accountPlan: 'TEAM' },
}

export function planFromNotes(notes: Record<string, string>): AccountPlan {
  const plan = notes?.accountPlan || notes?.plan
  if (plan === 'TEAM') return 'TEAM'
  if (plan === 'PRO') return 'PRO'

  const mapped = PLAN_AMOUNTS[String(plan || '')]?.accountPlan
  if (mapped === 'TEAM') return 'TEAM'
  if (mapped === 'PRO') return 'PRO'

  return 'FREE'
}

export function accountPlanFromBillingPlan(planId: string): AccountPlan {
  return PLAN_AMOUNTS[planId]?.accountPlan ?? 'FREE'
}
