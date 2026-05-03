import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}
const FROM = process.env.RESEND_FROM_EMAIL || 'hello@brandsyndicate.in'

function baseTemplate(title: string, body: string, ctaText?: string, ctaUrl?: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#09090A;color:#F0EAE0;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:560px;margin:0 auto;padding:48px 24px}
.logo{font-size:14px;letter-spacing:0.2em;text-transform:uppercase;color:#F8F4EE;margin-bottom:40px}
.logo span{color:#C9A84C}
.title{font-size:28px;line-height:1.2;color:#F8F4EE;margin-bottom:16px;font-weight:400}
.title em{color:#C9A84C;font-style:italic}
.body{font-size:14px;color:#A09890;line-height:1.8;font-weight:300;margin-bottom:32px}
.cta{display:inline-block;background:#C9A84C;color:#000;padding:12px 28px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-weight:600;text-decoration:none;border-radius:2px;margin-bottom:40px}
.footer{font-size:10px;color:#706860;letter-spacing:0.06em;border-top:1px solid rgba(255,255,255,0.06);padding-top:24px}
.divider{height:1px;background:rgba(255,255,255,0.06);margin:32px 0}
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">Brand <span>·</span> Syndicate</div>
  <h1 class="title">${title}</h1>
  <div class="body">${body}</div>
  ${ctaText && ctaUrl ? `<a href="${ctaUrl}" class="cta">${ctaText}</a>` : ''}
  <div class="divider"></div>
  <div class="footer">Brand Syndicate · AI-Powered Personal Branding · <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#C9A84C">${process.env.NEXT_PUBLIC_APP_URL}</a></div>
</div>
</body>
</html>`
}

// Generic mailer — used by contact form and any ad-hoc sends
export async function sendEmail({ to, subject, html }: {
  to: string
  subject: string
  html: string
}) {
  const resend = getResend()
  await resend.emails.send({ from: FROM, to, subject, html })
}

export async function sendWelcomeEmail(to: string, name: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'
  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Welcome to Brand Syndicate',
    html: baseTemplate(
      `Welcome, <em>${name}</em>.`,
      `Your personal branding studio is ready. Generate your portfolio, business card, resume, and pitch deck — all in one prompt, powered by Claude AI.<br><br>You're on the Free plan with 3 generations per month. Upgrade to Pro for unlimited access to all 48 templates.`,
      'Start Generating',
      `${appUrl}/generate`
    ),
  })
}

export async function sendLimitHitEmail(to: string, name: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "You've hit your generation limit",
    html: baseTemplate(
      `You've used all <em>3 generations</em>.`,
      `You've reached your monthly limit on the Free plan. Upgrade to Pro for unlimited generations, all 48 premium templates, and priority export processing.`,
      'Upgrade to Pro',
      `${appUrl}/billing`
    ),
  })
}

export async function sendExportReadyEmail(to: string, name: string, downloadUrl: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Your export is ready',
    html: baseTemplate(
      `Your export is <em>ready.</em>`,
      `Your Brand Syndicate export has been generated and is ready to download. The link is valid for 72 hours.`,
      'Download Now',
      downloadUrl
    ),
  })
}

export async function sendWeekOneEmail(to: string, name: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'
  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'How is your brand coming along?',
    html: baseTemplate(
      `One week in, <em>${name}</em>.`,
      `It's been a week since you joined Brand Syndicate. Have you shared your public portfolio URL yet? Try generating a pitch deck or business card — our 48 templates are ready when you are.`,
      'Back to Studio',
      `${appUrl}/generate`
    ),
  })
}

export async function sendWinBackEmail(to: string, name: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'
  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Your brand is waiting',
    html: baseTemplate(
      `Come back, <em>${name}</em>.`,
      `It's been a while since your last Brand Syndicate session. Your brand doesn't build itself — and we've added new templates since you last visited.`,
      'Return to Studio',
      `${appUrl}/generate`
    ),
  })
}
