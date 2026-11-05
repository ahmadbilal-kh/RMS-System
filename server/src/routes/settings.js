import { Router } from 'express'
import { z } from 'zod'
import { requireAdmin } from '../middleware/auth.js'
import RestaurantSettings from '../models/RestaurantSettings.js'

const router = Router()
const socialUrl = z.union([
  z.literal(''),
  z.string().url().max(500).refine((value) => /^https?:\/\//i.test(value)),
]).optional().default('')
const settingsSchema = z.object({
  restaurantName: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(120).optional().default(''),
  description: z.string().trim().max(1000).optional().default(''),
  phone: z.string().trim().min(5).max(40),
  email: z.string().trim().email().max(254),
  address: z.string().trim().min(4).max(250),
  hours: z.string().trim().max(250).optional().default(''),
  instagram: socialUrl,
  facebook: socialUrl,
})
const serialize = (settings) => ({ restaurantName: settings.restaurantName === 'Seasoned' ? 'DineNova' : settings.restaurantName, tagline: settings.tagline === 'Good food. Good company.' ? 'Good Food. Great Mood.' : settings.tagline, description: settings.description, phone: settings.phone, email: !settings.email || settings.email === 'hello@seasoned.example' ? 'support@seasoned.com' : settings.email, address: settings.address, hours: settings.hours, instagram: settings.instagram, facebook: settings.facebook })

router.get('/', async (_request, response, next) => {
  try {
    const settings = await RestaurantSettings.findOneAndUpdate({ key: 'default' }, { $setOnInsert: { key: 'default' } }, { new: true, upsert: true, setDefaultsOnInsert: true })
    return response.json({ settings: serialize(settings) })
  } catch (error) { return next(error) }
})

router.put('/', requireAdmin, async (request, response, next) => {
  try {
    const parsed = settingsSchema.safeParse(request.body)
    if (!parsed.success) return response.status(400).json({ message: parsed.error.issues[0].message })
    const settings = await RestaurantSettings.findOneAndUpdate({ key: 'default' }, { $set: parsed.data }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true })
    return response.json({ settings: serialize(settings) })
  } catch (error) { return next(error) }
})

export default router
