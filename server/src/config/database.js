import mongoose from 'mongoose'
import { configureMongoDns } from './mongoDns.js'

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required. Copy server/.env.example to server/.env and configure MongoDB Atlas.')
  configureMongoDns()
  mongoose.set('strictQuery', true)
  await mongoose.connect(process.env.MONGODB_URI)
  console.info('Connected to MongoDB.')
}
