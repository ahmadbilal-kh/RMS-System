import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import passport from '../config/passport.js'
import { clearSessionCookieOptions, sessionCookieName } from '../config/session.js'
import { emailDeliveryConfigured, sendPasswordResetCode, sendVerificationCode } from '../services/email.js'
import User from '../models/User.js'
import { publicUser, requireAuth } from '../middleware/auth.js'

const router = Router()
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many sign-in attempts. Please try again later.' } })
const registerLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many accounts were created from this connection. Please try later.' } })
const verificationLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many verification attempts. Please wait and try again.' } })
const passwordResetLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many password reset attempts. Please wait and try again.' } })
const wrap = (handler) => (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next)

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
})
const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  avatar: z.union([
    z.literal(''),
    z.string().max(900_000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/),
  ]).optional(),
})
const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(72) })
const verifyEmailSchema = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code from your email.'),
})
const resendVerificationSchema = z.object({ email: z.string().trim().email().max(254) })
const passwordResetRequestSchema = z.object({ email: z.string().trim().email().max(254) })
const passwordResetSchema = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit password reset code.'),
  password: z.string().min(8).max(72),
})
const verificationCodeHash = (code) => createHash('sha256').update(code).digest('hex')

async function issueVerificationCode(user) {
  const code = String(randomInt(100000, 1000000))
  user.emailVerificationCodeHash = verificationCodeHash(code)
  user.emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
  await user.save()
  await sendVerificationCode({ email: user.email, name: user.name, code })
}

function codeMatches(code, storedHash) {
  if (!storedHash) return false
  const actual = Buffer.from(verificationCodeHash(code), 'hex')
  const expected = Buffer.from(storedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

router.post('/register', registerLimit, wrap(async (request, response) => {
  const parsed = registerSchema.safeParse(request.body)
  if (!parsed.success) return response.status(400).json({ message: parsed.error.issues[0].message })
  const email = parsed.data.email.toLowerCase()
  const existingUser = await User.findOne({ email }).select('+passwordHash')
  if (existingUser) {
    return response.status(409).json({ message: 'An account with this email already exists. Please sign in instead.' })
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  const user = await User.create({ name: parsed.data.name, email, passwordHash, authProvider: 'local', role: 'customer', emailVerified: true })
  request.login(user, (error) => {
    if (error) return response.status(500).json({ message: 'Your account was created, but sign-in could not be completed. Please sign in.' })
    return response.status(201).json({ user: publicUser(user) })
  })
}))

router.post('/verify-email', verificationLimit, wrap(async (request, response) => {
  const parsed = verifyEmailSchema.safeParse(request.body)
  if (!parsed.success) return response.status(400).json({ message: parsed.error.issues[0].message })
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() })
    .select('+emailVerificationCodeHash +emailVerificationExpiresAt')
  if (!user || user.emailVerified || !codeMatches(parsed.data.code, user.emailVerificationCodeHash)) {
    return response.status(400).json({ message: 'That verification code is incorrect or expired.' })
  }
  if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt.getTime() < Date.now()) {
    return response.status(400).json({ message: 'That verification code has expired. Request a new one.' })
  }
  user.emailVerified = true
  user.emailVerificationCodeHash = undefined
  user.emailVerificationExpiresAt = undefined
  await user.save()
  request.login(user, (error) => {
    if (error) return response.status(500).json({ message: 'Your email was verified, but sign-in did not complete. Please sign in.' })
    return response.json({ user: publicUser(user) })
  })
}))

router.post('/resend-verification', verificationLimit, wrap(async (request, response) => {
  const parsed = resendVerificationSchema.safeParse(request.body)
  if (!parsed.success) return response.status(400).json({ message: 'Enter a valid email address.' })
  if (!emailDeliveryConfigured()) return response.status(503).json({ message: 'Email verification is not configured. Add RESEND_API_KEY and EMAIL_FROM to server/.env.' })
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() })
  if (!user || user.emailVerified) return response.json({ message: 'If your account needs verification, a new code has been sent.' })
  try {
    await issueVerificationCode(user)
  } catch (error) {
    return response.status(502).json({ message: error.message || 'The verification email could not be sent. Please try again.' })
  }
  return response.json({ message: 'A new verification code has been sent.' })
}))

router.post('/forgot-password', passwordResetLimit, wrap(async (request, response) => {
  const parsed = passwordResetRequestSchema.safeParse(request.body)
  if (!parsed.success) return response.status(400).json({ message: 'Enter a valid email address.' })
  const genericMessage = 'If an account with that email exists, a password reset code has been sent.'
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() })
    .select('+passwordHash +passwordResetCodeHash +passwordResetExpiresAt')
  if (!user?.passwordHash) return response.json({ message: genericMessage })

  const code = String(randomInt(100000, 1000000))
  user.passwordResetCodeHash = verificationCodeHash(code)
  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
  await user.save()
  try {
    await sendPasswordResetCode({ email: user.email, name: user.name, code })
  } catch (error) {
    user.passwordResetCodeHash = undefined
    user.passwordResetExpiresAt = undefined
    await user.save()
    return response.status(502).json({ message: error.message || 'The password reset email could not be sent. Please try again.' })
  }
  return response.json({ message: genericMessage })
}))

router.post('/reset-password', passwordResetLimit, wrap(async (request, response) => {
  const parsed = passwordResetSchema.safeParse(request.body)
  if (!parsed.success) return response.status(400).json({ message: parsed.error.issues[0].message })
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() })
    .select('+passwordHash +passwordResetCodeHash +passwordResetExpiresAt')
  if (!user?.passwordHash || !user.passwordResetCodeHash || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now() || !codeMatches(parsed.data.code, user.passwordResetCodeHash)) {
    return response.status(400).json({ message: 'That password reset code is incorrect or expired. Request a new code and try again.' })
  }
  user.passwordHash = await bcrypt.hash(parsed.data.password, 12)
  user.passwordResetCodeHash = undefined
  user.passwordResetExpiresAt = undefined
  await user.save()
  return response.json({ message: 'Password updated. Sign in with your new password.' })
}))

router.post('/login', loginLimit, wrap(async (request, response) => {
  const parsed = loginSchema.safeParse(request.body)
  if (!parsed.success) return response.status(400).json({ message: 'Enter a valid email and password.' })
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select('+passwordHash')
  if (!user) {
    return response.status(401).json({ message: 'Account not found. Please register first.' })
  }
  if (!user.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return response.status(401).json({ message: 'Email or password is incorrect.' })
  }
  if (user.emailVerified === false) return response.status(403).json({ message: 'Please verify your email before signing in. Request a verification code to continue.' })
  request.login(user, (error) => {
    if (error) return response.status(500).json({ message: 'Sign-in could not be completed. Please try again.' })
    return response.json({ user: publicUser(user) })
  })
}))

router.post('/logout', (request, response, next) => {
  request.logout((logoutError) => {
    if (logoutError) return next(logoutError)
    request.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError)
      response.clearCookie(sessionCookieName, clearSessionCookieOptions)
      return response.json({ message: 'Signed out.' })
    })
  })
})

router.get('/me', requireAuth, (request, response) => response.json({ user: publicUser(request.user) }))

router.patch('/profile', requireAuth, wrap(async (request, response) => {
  const parsed = profileSchema.safeParse(request.body)
  if (!parsed.success) return response.status(400).json({ message: parsed.error.issues[0].message })
  request.user.name = parsed.data.name
  if (parsed.data.avatar !== undefined) request.user.avatar = parsed.data.avatar
  await request.user.save()
  return response.json({ user: publicUser(request.user) })
}))

const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
router.get('/google', (request, response, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return response.status(503).json({ message: 'Google sign-in has not been configured.' })
  passport.authenticate('google', { scope: ['email', 'profile'], session: true, state: true })(request, response, next)
})

router.get('/google/callback', (request, response, next) => {
  passport.authenticate('google', { failureRedirect: frontendUrl() + '/login?oauth=failed', session: true, state: true }, (error, user) => {
    if (error) return next(error)
    if (!user) return response.redirect(frontendUrl() + '/login?oauth=failed')
    request.login(user, (loginError) => {
      if (loginError) return next(loginError)
      return response.redirect(frontendUrl() + (user.role === 'admin' ? '/admin' : '/'))
    })
  })(request, response, next)
})

export default router
