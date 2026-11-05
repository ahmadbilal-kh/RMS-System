import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  quantity: { type: Number, required: true, min: 1, max: 20 },
  unitPrice: { type: Number, required: true, min: 0 },
}, { _id: false })

const bookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  customerName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254, index: true },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  time: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  guests: { type: Number, required: true, min: 1, max: 12 },
  occasion: { type: String, trim: true, maxlength: 80, default: '' },
  specialRequests: { type: String, trim: true, maxlength: 1000, default: '' },
  orderItems: { type: [orderItemSchema], default: [] },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending', index: true },
}, { timestamps: true })

bookingSchema.index({ date: 1, time: 1 })
export default mongoose.model('Booking', bookingSchema)
