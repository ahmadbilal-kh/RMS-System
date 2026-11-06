import { Router } from 'express'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import Booking from '../models/Booking.js'
import MenuItem from '../models/MenuItem.js'

const router = Router()
const wrap = (handler) => (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next)
const bookingLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many reservation requests. Please call the restaurant to book.' } })
const bookingSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(40),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(value + 'T00:00:00Z')
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  }, 'Please choose a valid date.'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  guests: z.coerce.number().int().min(1).max(12),
  occasion: z.string().trim().max(80).optional().default(''),
  specialRequests: z.string().trim().max(1000).optional().default(''),
  foodItems: z.array(z.object({
    menuItemId: z.string().regex(/^[a-f\d]{24}$/i, 'Please select a valid menu item.'),
    quantity: z.coerce.number().int().min(1).max(20),
  })).max(50).refine((items) => new Set(items.map((item) => item.menuItemId)).size === items.length, 'A dish can only be listed once.').optional().default([]),
})
const statusSchema = z.object({ status: z.enum(['pending', 'confirmed', 'cancelled']) })
const customerUpdateSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(40),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(value + 'T00:00:00Z')
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  }, 'Please choose a valid date.'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  guests: z.coerce.number().int().min(1).max(12),
  occasion: z.string().trim().max(80).optional().default(''),
  specialRequests: z.string().trim().max(1000).optional().default(''),
})
const serialize = (booking) => {
  const orderItems = (booking.orderItems || []).map((item) => ({
    menuItemId: item.menuItem?.toString(),
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }))
  return {
    id: booking.id,
    customerName: booking.customerName,
    email: booking.email,
    phone: booking.phone,
    date: booking.date,
    time: booking.time,
    guests: booking.guests,
    occasion: booking.occasion,
    specialRequests: booking.specialRequests,
    orderItems,
    orderTotal: orderItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
    status: booking.status,
    createdAt: booking.createdAt,
  }
}

router.post('/', bookingLimit, wrap(async (request, response) => {
  const parsed = bookingSchema.safeParse(request.body)
  if (!parsed.success) return response.status(400).json({ message: parsed.error.issues[0].message })
  if (parsed.data.date < new Date().toISOString().slice(0, 10)) return response.status(400).json({ message: 'Please choose a date in the future.' })
  const { foodItems, ...bookingData } = parsed.data
  const menuItems = foodItems.length
    ? await MenuItem.find({ _id: { $in: foodItems.map((item) => item.menuItemId) }, isAvailable: true })
    : []
  if (menuItems.length !== foodItems.length) {
    return response.status(400).json({ message: 'One or more selected dishes are no longer available. Please refresh the menu and try again.' })
  }
  const menuById = new Map(menuItems.map((item) => [item.id, item]))
  const orderItems = foodItems.map(({ menuItemId, quantity }) => {
    const item = menuById.get(menuItemId)
    return { menuItem: item._id, name: item.name, quantity, unitPrice: item.price }
  })
  const booking = await Booking.create({ ...bookingData, orderItems, email: parsed.data.email.toLowerCase(), customer: request.user?._id || null })
  return response.status(201).json({ booking: serialize(booking) })
}))

router.get('/mine', requireAuth, wrap(async (request, response) => {
  const bookings = await Booking.find({ $or: [{ customer: request.user._id }, { email: request.user.email }] }).sort({ date: 1, time: 1 })
  return response.json({ bookings: bookings.map(serialize) })
}))

const updateMyBooking = wrap(async (request, response) => {
  const id = request.params.id || request.body.id
  if (!mongoose.isValidObjectId(id)) return response.status(404).json({ message: 'Reservation not found.' })
  const booking = await Booking.findOne({ _id: id, $or: [{ customer: request.user._id }, { email: request.user.email }] })
  if (!booking) return response.status(404).json({ message: 'Reservation not found.' })
  if (booking.status === 'cancelled') return response.status(409).json({ message: 'Cancelled reservations cannot be edited.' })
  const parsed = customerUpdateSchema.safeParse(request.body)
  if (!parsed.success) return response.status(400).json({ message: parsed.error.issues[0].message })
  if (parsed.data.date < new Date().toISOString().slice(0, 10)) return response.status(400).json({ message: 'Please choose a future date.' })
  Object.assign(booking, parsed.data, { status: 'pending' })
  await booking.save()
  return response.json({ booking: serialize(booking) })
})

router.patch('/mine-item', requireAuth, updateMyBooking)
router.patch('/mine/:id', requireAuth, updateMyBooking)

const deleteMyBooking = wrap(async (request, response) => {
  const id = request.params.id || request.body.id
  if (!mongoose.isValidObjectId(id)) return response.status(404).json({ message: 'Reservation not found.' })
  const booking = await Booking.findOne({ _id: id, $or: [{ customer: request.user._id }, { email: request.user.email }] })
  if (!booking) return response.status(404).json({ message: 'Reservation not found.' })
  await booking.deleteOne()
  return response.json({ message: 'Reservation deleted.' })
})

router.delete('/mine-item', requireAuth, deleteMyBooking)
router.delete('/mine/:id', requireAuth, deleteMyBooking)

router.get('/', requireAdmin, wrap(async (_request, response) => {
  const bookings = await Booking.find().sort({ date: -1, time: -1 }).limit(500)
  return response.json({ bookings: bookings.map(serialize) })
}))

const updateBookingStatus = wrap(async (request, response) => {
  const id = request.params.id || request.body.id
  if (!mongoose.isValidObjectId(id)) return response.status(404).json({ message: 'Reservation not found.' })
  const parsed = statusSchema.safeParse(request.body)
  if (!parsed.success) return response.status(400).json({ message: 'Choose a valid reservation status.' })
  const booking = await Booking.findByIdAndUpdate(id, { status: parsed.data.status }, { new: true, runValidators: true })
  if (!booking) return response.status(404).json({ message: 'Reservation not found.' })
  return response.json({ booking: serialize(booking) })
})

router.patch('/status', requireAdmin, updateBookingStatus)
router.patch('/:id/status', requireAdmin, updateBookingStatus)

export default router
