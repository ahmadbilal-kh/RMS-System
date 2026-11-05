import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import User from '../models/User.js'

const adminEmails = () => new Set((process.env.ADMIN_EMAILS || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean))

export function configurePassport() {
  passport.serializeUser((user, done) => done(null, user.id))
  passport.deserializeUser(async (id, done) => {
    try { done(null, await User.findById(id)) } catch (error) { done(error) }
  })

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback',
    scope: ['email', 'profile'],
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const emailEntry = profile.emails?.find((item) => item.value)
      const email = emailEntry?.value?.toLowerCase()
      const verified = profile._json?.email_verified === true || emailEntry?.verified === true
      if (!email || !verified) return done(null, false, { message: 'Google did not provide a verified email address.' })

      let user = await User.findOne({ email }).select('+passwordHash')
      if (user) {
        if (user.googleId && user.googleId !== profile.id) return done(null, false, { message: 'This email is linked to another Google account.' })
        user.googleId = profile.id
        user.authProvider = user.passwordHash ? 'local+google' : 'google'
        if (adminEmails().has(email)) user.role = 'admin'
        await user.save()
      } else {
        user = await User.create({
          name: profile.displayName || email.split('@')[0],
          email,
          googleId: profile.id,
          authProvider: 'google',
          role: adminEmails().has(email) ? 'admin' : 'customer',
        })
      }
      done(null, user)
    } catch (error) { done(error) }
  }))
}

export default passport
