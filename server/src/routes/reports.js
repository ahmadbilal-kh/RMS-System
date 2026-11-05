import { Router } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import Booking from '../models/Booking.js'

const router = Router()
router.get('/overview', requireAdmin, async (_request, response, next) => {
  try {
    const [total, pending, confirmed, guestTotal, dayCounts] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$guests' } } }]),
      (async () => {
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)
        const start = new Date(today)
        start.setUTCDate(start.getUTCDate() - 6)
        const startDate = start.toISOString().slice(0, 10)
        const endDate = today.toISOString().slice(0, 10)
        const records = await Booking.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate }, status: { $ne: 'cancelled' } } },
          { $group: { _id: '$date', count: { $sum: 1 } } },
        ])
        const byDate = new Map(records.map((record) => [record._id, record.count]))
        return Array.from({ length: 7 }, (_, index) => {
          const date = new Date(start)
          date.setUTCDate(start.getUTCDate() + index)
          return byDate.get(date.toISOString().slice(0, 10)) || 0
        })
      })(),
    ])
    return response.json({ report: { total, pending, confirmed, guests: guestTotal[0]?.total || 0, weekly: dayCounts } })
  } catch (error) { return next(error) }
})
export default router
