import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

function validateProductionClientEnv(env) {
  if (env.VITE_DEMO_MODE !== 'false') {
    throw new Error('Production builds require VITE_DEMO_MODE=false. Copy the production values from DEPLOYMENT.md into .env.production or your build environment.')
  }
  if (!env.VITE_API_URL) {
    throw new Error('Production builds require VITE_API_URL. Use / for Vercel same-origin API routing, or provide the deployed API HTTPS origin.')
  }
  if (env.VITE_API_URL === '/') {
    return
  }

  let apiUrl
  try {
    apiUrl = new URL(env.VITE_API_URL)
  } catch {
    throw new Error('VITE_API_URL must be a valid HTTPS origin for production.')
  }
  const configuredOrigin = env.VITE_API_URL.replace(/\/$/, '')
  if (
    apiUrl.protocol !== 'https:' ||
    apiUrl.origin !== configuredOrigin ||
    ['localhost', '127.0.0.1', '::1'].includes(apiUrl.hostname) ||
    apiUrl.hostname.endsWith('.example') ||
    /your-real-domain|example\.(com|net|org)$/i.test(apiUrl.hostname)
  ) {
    throw new Error('VITE_API_URL must be the public HTTPS origin of the live API, without a path or placeholder hostname.')
  }
}

export default defineConfig(({ command, mode }) => {
  if (command === 'build' && mode === 'production') {
    validateProductionClientEnv(loadEnv(mode, process.cwd(), ''))
  }
  return {
    plugins: [react()],
  }
})
