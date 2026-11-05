import { configureMongoDns } from './config/mongoDns.js'
import { validateProductionEnvironment } from './config/productionEnv.js'

let appPromise

async function initializeApi() {
  if (process.env.VERCEL_ENV === 'production') process.env.NODE_ENV = 'production'
  configureMongoDns()
  validateProductionEnvironment()

  const [{ default: app }, { connectDatabase }] = await Promise.all([
    import('./app.js'),
    import('./config/database.js'),
  ])
  try {
    await connectDatabase()
  } catch (error) {
    console.error('DineNova MongoDB connection failed:', error?.name || 'Error', error?.code || '')
    const databaseError = new Error('DATABASE_CONNECTION_FAILED')
    databaseError.cause = error
    throw databaseError
  }
  return app
}

export default async function handler(request, response) {
  try {
    appPromise ||= initializeApi()
    const app = await appPromise
    return await new Promise((resolve, reject) => {
      response.once('finish', resolve)
      response.once('close', resolve)
      try {
        app(request, response)
      } catch (error) {
        response.off('finish', resolve)
        response.off('close', resolve)
        reject(error)
      }
    })
  } catch (error) {
    appPromise = undefined
    if (error?.message?.startsWith('Production configuration is incomplete:')) {
      console.error('DineNova API configuration error:', error.message)
      return response.status(503).json({ message: error.message })
    }
    if (error?.message === 'DATABASE_CONNECTION_FAILED') {
      return response.status(503).json({
        message: 'Database connection failed. Check MONGODB_URI and allow Vercel in MongoDB Atlas Network Access.',
      })
    } else {
      console.error('DineNova API initialization failed:', error?.name || 'Error', error?.code || '')
    }
    return response.status(503).json({ message: 'The API is temporarily unavailable.' })
  }
}
