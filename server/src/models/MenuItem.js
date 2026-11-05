import mongoose from 'mongoose'

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  category: { type: String, required: true, trim: true, maxlength: 50 },
  price: { type: Number, required: true, min: 0, max: 100000 },
  image: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true })

menuItemSchema.index({ category: 1, isAvailable: 1 })
export default mongoose.model('MenuItem', menuItemSchema)
