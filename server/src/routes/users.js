import { Router } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import User from '../models/User.js'
import Booking from '../models/Booking.js'

const router = Router()
router.get('/', requireAdmin, async (_request, response, next) => {
  try {
    const [registeredUsers, reservations] = await Promise.all([
      User.find({ role: 'customer' }).select('name email createdAt').sort({ createdAt: -1 }).limit(500),
      Booking.find().select('customerName email createdAt').sort({ createdAt: -1 }).limit(500),
    ])
    const byEmail = new Map()
    for (const booking of reservations) {
      const email = booking.email.toLowerCase()
      if (!byEmail.has(email)) byEmail.set(email, { id: booking.id, name: booking.customerName, email, createdAt: booking.createdAt })
    }
    for (const user of registeredUsers) {
      const email = user.email.toLowerCase()
      byEmail.set(email, { id: user.id, name: user.name, email, createdAt: user.createdAt })
    }
    return response.json({ users: [...byEmail.values()] })
  } catch (error) { return next(error) }
})
export default router
