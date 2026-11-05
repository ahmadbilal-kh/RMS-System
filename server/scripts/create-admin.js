import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import User from '../src/models/User.js'
import { configureMongoDns } from '../src/config/mongoDns.js'

const [emailInput, ...nameParts] = process.argv.slice(2)
const email = emailInput?.trim().toLowerCase()
const password = process.env.ADMIN_INITIAL_PASSWORD
const name = nameParts.join(' ').trim() || 'Restaurant Administrator'

if (!email || !password || password.length < 12 || password.length > 72) {
  console.error('Set ADMIN_INITIAL_PASSWORD in server/.env to a unique 12–72 character password, then run:')
  console.error('npm run admin:create -- owner@seasoned.com "Owner Name"')
  process.exit(1)
}

try {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required in server/.env.')
  configureMongoDns()
  await mongoose.connect(process.env.MONGODB_URI)
  const passwordHash = await bcrypt.hash(password, 12)
  await User.findOneAndUpdate(
    { email },
    { $set: { name, email, passwordHash, role: 'admin', authProvider: 'local' } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  )
  console.info('Administrator account is ready for ' + email + '.')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
