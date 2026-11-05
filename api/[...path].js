import { configureMongoDns } from '../server/src/config/mongoDns.js'
import { validateProductionEnvironment } from '../server/src/config/productionEnv.js'

let appPromise

async function initializeApi() {
  if (process.env.VERCEL_ENV === 'production') process.env.NODE_ENV = 'production'
  configureMongoDns()
  validateProductionEnvironment()

  const [{ default: app }, { connectDatabase }] = await Promise.all([
    import('../server/src/app.js'),
    import('../server/src/config/database.js'),
  ])
  await connectDatabase()
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
    } else {
      console.error('DineNova API initialization failed:', error?.name || 'Error', error?.code || '')
    }
    return response.status(503).json({ message: 'The API is temporarily unavailable.' })
  }
}
