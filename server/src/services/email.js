const htmlEscape = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]))

export const emailDeliveryConfigured = () => Boolean(
  process.env.RESEND_API_KEY && process.env.EMAIL_FROM,
)

export async function sendVerificationCode({ email, name, code }) {
  if (!emailDeliveryConfigured()) {
    throw new Error('Email verification needs RESEND_API_KEY and EMAIL_FROM in server/.env.')
  }

  const safeName = htmlEscape(name || 'there')
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: 'Your DineNova verification code',
      text: `Hi ${name || 'there'}, your DineNova verification code is ${code}. It expires in 15 minutes.`,
      html: `<div style="font-family:Arial,sans-serif;color:#17130b;max-width:520px;margin:auto;padding:28px"><p style="color:#98701b;letter-spacing:3px;font-size:12px">DINENOVA</p><h1 style="font-family:Georgia,serif;font-weight:500">Verify your email</h1><p>Hi ${safeName}, use this code to finish creating your account:</p><p style="font-size:32px;letter-spacing:8px;font-weight:700;background:#f7f0df;padding:18px;text-align:center">${code}</p><p>This code expires in 15 minutes. If you did not request it, you can ignore this message.</p></div>`,
    }),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(result.message || 'The verification email could not be sent.')
  }
}

export async function sendPasswordResetCode({ email, name, code }) {
  if (!emailDeliveryConfigured()) {
    throw new Error('Password reset email needs RESEND_API_KEY and EMAIL_FROM in server/.env.')
  }

  const safeName = htmlEscape(name || 'there')
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: 'Your DineNova password reset code',
      text: `Hi ${name || 'there'}, your DineNova password reset code is ${code}. It expires in 15 minutes. If you did not request a reset, ignore this message.`,
      html: `<div style="font-family:Arial,sans-serif;color:#17130b;max-width:520px;margin:auto;padding:28px"><p style="color:#98701b;letter-spacing:3px;font-size:12px">DINENOVA</p><h1 style="font-family:Georgia,serif;font-weight:500">Reset your password</h1><p>Hi ${safeName}, enter this code in DineNova to choose a new password:</p><p style="font-size:32px;letter-spacing:8px;font-weight:700;background:#f7f0df;padding:18px;text-align:center">${code}</p><p>This code expires in 15 minutes. If you did not request a password reset, you can ignore this message.</p></div>`,
    }),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'The password reset email could not be sent.')
}
