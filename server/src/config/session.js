const production = process.env.NODE_ENV === 'production'
const requestedSameSite = (process.env.SESSION_COOKIE_SAMESITE || 'lax').toLowerCase()

if (!['strict', 'lax', 'none'].includes(requestedSameSite)) {
  throw new Error('SESSION_COOKIE_SAMESITE must be strict, lax, or none.')
}

export const sessionCookieName = 'rms.sid'
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: requestedSameSite,
  secure: production || requestedSameSite === 'none',
  maxAge: 1000 * 60 * 60 * 24 * 7,
}
export const clearSessionCookieOptions = {
  httpOnly: true,
  sameSite: requestedSameSite,
  secure: production || requestedSameSite === 'none',
  path: '/',
}
