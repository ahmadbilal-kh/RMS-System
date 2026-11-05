import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema({
  key: { type: String, default: 'default', unique: true },
  restaurantName: { type: String, default: 'DineNova', trim: true, maxlength: 80 },
  tagline: { type: String, default: 'Good Food. Great Mood.', trim: true, maxlength: 120 },
  description: { type: String, default: '', trim: true, maxlength: 1000 },
  phone: { type: String, default: '', trim: true, maxlength: 40 },
  email: { type: String, default: 'support@seasoned.com', lowercase: true, trim: true, maxlength: 254 },
  address: { type: String, default: '', trim: true, maxlength: 250 },
  hours: { type: String, default: '', trim: true, maxlength: 250 },
  instagram: { type: String, default: '', trim: true, maxlength: 500 },
  facebook: { type: String, default: '', trim: true, maxlength: 500 },
}, { timestamps: true })

export default mongoose.model('RestaurantSettings', settingsSchema)
