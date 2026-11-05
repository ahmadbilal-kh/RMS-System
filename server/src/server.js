import 'dotenv/config'
import { configureMongoDns } from './config/mongoDns.js'
import { validateProductionEnvironment } from './config/productionEnv.js'

configureMongoDns()

const port = Number(process.env.PORT || 4000)

try {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters. Set a long, random value in server/.env.')
  }
  validateProductionEnvironment()
  const [{ default: app }, { connectDatabase }] = await Promise.all([
    import('./app.js'),
    import('./config/database.js'),
  ])
  await connectDatabase()
  app.listen(port, () => console.info('Restaurant API listening on port ' + port + '.'))
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
