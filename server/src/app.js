import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import passport, { configurePassport } from './config/passport.js'
import { sessionCookieName, sessionCookieOptions } from './config/session.js'
import authRoutes from './routes/auth.js'
import menuRoutes from './routes/menu.js'
import bookingRoutes from './routes/bookings.js'
import reportRoutes from './routes/reports.js'
import settingsRoutes from './routes/settings.js'
import userRoutes from './routes/users.js'
import { errorHandler, notFound } from './middleware/errors.js'

configurePassport()

const app = express()
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
const apiPublicUrl = (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/$/, '')
const production = process.env.NODE_ENV === 'production'

if (production) app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:', apiPublicUrl],
      connectSrc: ["'self'", frontendUrl],
      objectSrc: ["'none'"],
      ...(production ? { upgradeInsecureRequests: [] } : {}),
    },
  },
  crossOriginEmbedderPolicy: false,
}))
app.use(cors({ origin: frontendUrl, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type'] }))
app.use(express.json({ limit: '1mb' }))
app.use(session({
  name: sessionCookieName,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI, collectionName: 'sessions', ttl: 60 * 60 * 24 * 7 }),
  cookie: sessionCookieOptions,
}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/api/health', (_request, response) => response.json({ ok: true, service: 'dinenova-restaurant-api' }))
app.use('/api/auth', authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/users', userRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
