function httpsOrigin(name, value, errors) {
  if (!value) {
    errors.push(`${name} is required in production.`)
    return ''
  }
  try {
    const parsed = new URL(value)
    const origin = value.replace(/\/$/, '')
    if (parsed.protocol !== 'https:' || parsed.origin !== origin || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      errors.push(`${name} must be a public HTTPS origin without a path, query, or fragment.`)
      return ''
    }
    if (
      ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) ||
      parsed.hostname.endsWith('.example') ||
      /your-real-domain|example\.(com|net|org)$/i.test(parsed.hostname)
    ) {
      errors.push(`${name} cannot use a localhost or example hostname in production.`)
      return ''
    }
    return origin
  } catch {
    errors.push(`${name} must be a valid HTTPS origin.`)
    return ''
  }
}

function verifyProductionConfiguration(env) {
  const errors = []
  const databaseUri = env.MONGODB_URI || ''
  if (!/^mongodb(?:\+srv)?:\/\//i.test(databaseUri) || /<[^>]+>|cluster-host|db-user|db-password/i.test(databaseUri)) {
    errors.push('MONGODB_URI must be a real MongoDB connection string, not the example placeholder.')
  } else {
    try {
      const databaseUrl = new URL(databaseUri)
      const host = databaseUrl.hostname
      if (!host || ['localhost', '127.0.0.1', '::1'].includes(host)) errors.push('MONGODB_URI must point to the production database, not localhost.')
      if (databaseUrl.pathname === '/') errors.push('MONGODB_URI must include a production database name in its path.')
    } catch {
      errors.push('MONGODB_URI is not a valid MongoDB connection string.')
    }
  }

  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32 || /replace-with|change-me|example/i.test(env.SESSION_SECRET)) {
    errors.push('SESSION_SECRET must be a unique random secret with at least 32 characters.')
  }

  const vercelHostname = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL || ''
  const vercelOrigin = vercelHostname ? `https://${vercelHostname.replace(/^https?:\/\//, '')}` : ''
  const frontendOrigin = httpsOrigin('FRONTEND_URL', env.FRONTEND_URL || vercelOrigin, errors)
  const apiOrigin = httpsOrigin('API_PUBLIC_URL', env.API_PUBLIC_URL || vercelOrigin, errors)

  const sameSite = (env.SESSION_COOKIE_SAMESITE || 'lax').toLowerCase()
  if (!['strict', 'lax', 'none'].includes(sameSite)) {
    errors.push('SESSION_COOKIE_SAMESITE must be strict, lax, or none.')
  }

  const hasGoogleClientId = Boolean(env.GOOGLE_CLIENT_ID)
  const hasGoogleClientSecret = Boolean(env.GOOGLE_CLIENT_SECRET)
  if (hasGoogleClientId !== hasGoogleClientSecret) {
    errors.push('Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or leave both empty.')
  }
  if (hasGoogleClientId && apiOrigin) {
    const expectedCallback = `${apiOrigin}/api/auth/google/callback`
    if (env.GOOGLE_CALLBACK_URL !== expectedCallback) {
      errors.push(`GOOGLE_CALLBACK_URL must exactly match ${expectedCallback}.`)
    }
  }

  if (errors.length) {
    throw new Error(`Production configuration is incomplete:\n- ${errors.join('\n- ')}`)
  }

  return { frontendOrigin, apiOrigin }
}

export function validateProductionEnvironment(env = process.env) {
  if (env.VERCEL_ENV && env.VERCEL_ENV !== 'production') return null
  if (env.NODE_ENV !== 'production') return null
  return verifyProductionConfiguration(env)
}
