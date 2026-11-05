import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  avatar: { type: String, default: '', maxlength: 900000 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, select: false },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  authProvider: { type: String, enum: ['local', 'google', 'local+google'], default: 'local' },
  emailVerified: { type: Boolean, default: true },
  emailVerificationCodeHash: { type: String, select: false },
  emailVerificationExpiresAt: { type: Date, select: false },
  passwordResetCodeHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
  googleId: { type: String, sparse: true, unique: true },
}, { timestamps: true })

export default mongoose.model('User', userSchema)
