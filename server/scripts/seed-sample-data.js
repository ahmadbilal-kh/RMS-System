import 'dotenv/config'
import mongoose from 'mongoose'
import { demoMenu, defaultSettings } from '../../src/data/demoData.js'
import MenuItem from '../src/models/MenuItem.js'
import RestaurantSettings from '../src/models/RestaurantSettings.js'
import { configureMongoDns } from '../src/config/mongoDns.js'

try {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required in server/.env.')
  configureMongoDns()
  await mongoose.connect(process.env.MONGODB_URI)
  for (const item of demoMenu) {
    const values = { ...item }
    delete values.id
    await MenuItem.updateOne({ name: item.name }, { $setOnInsert: values }, { upsert: true })
  }
  await RestaurantSettings.updateOne({ key: 'default' }, { $setOnInsert: { key: 'default', ...defaultSettings } }, { upsert: true, setDefaultsOnInsert: true })
  console.info('Sample menu and restaurant settings are ready. Existing menu items were left unchanged.')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
