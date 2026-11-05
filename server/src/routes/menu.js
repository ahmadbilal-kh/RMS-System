import express, { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { requireAdmin } from '../middleware/auth.js'
import MenuItem from '../models/MenuItem.js'

const router = Router()
const wrap = (handler) => (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next)
const imageUploadBody = express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' })
const imageBucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'menuImages' })
const itemSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(2).max(500),
  category: z.string().trim().min(2).max(50),
  price: z.coerce.number().min(0).max(100000),
  image: z.string().trim().max(500).optional().default(''),
  featured: z.boolean().optional().default(false),
  isAvailable: z.boolean().optional().default(true),
})
const serialize = (item) => ({ id: item.id, name: item.name, description: item.description, category: item.category, price: item.price, image: item.image, featured: item.featured, isAvailable: item.isAvailable ?? true })

router.get('/', wrap(async (request, response) => {
  const manage = request.query.manage === 'true'
  if (manage && request.user?.role !== 'admin') return response.status(request.user ? 403 : 401).json({ message: 'Administrator access is required.' })
  const publicMenuFilter = { isAvailable: { $ne: false } }
  const items = await MenuItem.find(manage ? {} : publicMenuFilter).sort({ category: 1, name: 1 })
  return response.json({ items: items.map(serialize) })
}))

router.post('/images', requireAdmin, imageUploadBody, wrap(async (request, response) => {
  const contentType = String(request.headers['content-type'] || '').split(';')[0].toLowerCase()
  if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
    return response.status(400).json({ message: 'Choose an image file to upload.' })
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
    return response.status(415).json({ message: 'Choose a JPEG, PNG, or WebP image.' })
  }
  const extension = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1]
  const upload = imageBucket().openUploadStream(`menu-${Date.now()}.${extension}`, {
    metadata: { contentType },
  })
  await new Promise((resolve, reject) => {
    upload.once('finish', resolve)
    upload.once('error', reject)
    upload.end(request.body)
  })
  return response.status(201).json({ image: `/api/menu/images/${upload.id.toString()}` })
}))

router.get('/images/:id', wrap(async (request, response, next) => {
  if (!mongoose.Types.ObjectId.isValid(request.params.id)) {
    return response.status(404).json({ message: 'Image not found.' })
  }
  const bucket = imageBucket()
  const [file] = await bucket.find({ _id: new mongoose.Types.ObjectId(request.params.id) }).toArray()
  if (!file) return response.status(404).json({ message: 'Image not found.' })
  response.set('Content-Type', file.metadata?.contentType || 'application/octet-stream')
  response.set('Cache-Control', 'public, max-age=31536000, immutable')
  const download = bucket.openDownloadStream(file._id)
  download.on('error', next)
  return download.pipe(response)
}))

router.get('/:id', wrap(async (request, response) => {
  const item = await MenuItem.findById(request.params.id)
  if (!item || (!item.isAvailable && request.user?.role !== 'admin')) return response.status(404).json({ message: 'Menu item not found.' })
  return response.json({ item: serialize(item) })
}))

router.post('/', requireAdmin, wrap(async (request, response) => {
  const parsed = itemSchema.safeParse(request.body)
  if (!parsed.success) return response.status(400).json({ message: parsed.error.issues[0].message })
  await MenuItem.create(parsed.data)
  const items = await MenuItem.find().sort({ category: 1, name: 1 })
  return response.status(201).json({ items: items.map(serialize) })
}))

router.put('/:id', requireAdmin, wrap(async (request, response) => {
  const parsed = itemSchema.safeParse(request.body)
  if (!parsed.success) return response.status(400).json({ message: parsed.error.issues[0].message })
  const item = await MenuItem.findByIdAndUpdate(request.params.id, parsed.data, { new: true, runValidators: true })
  if (!item) return response.status(404).json({ message: 'Menu item not found.' })
  const items = await MenuItem.find().sort({ category: 1, name: 1 })
  return response.json({ items: items.map(serialize) })
}))

router.delete('/:id', requireAdmin, wrap(async (request, response) => {
  const item = await MenuItem.findByIdAndDelete(request.params.id)
  if (!item) return response.status(404).json({ message: 'Menu item not found.' })
  const items = await MenuItem.find().sort({ category: 1, name: 1 })
  return response.json({ items: items.map(serialize) })
}))

export default router
