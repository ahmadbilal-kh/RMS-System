export function requireAuth(request, response, next) {
  if (request.isAuthenticated?.() && request.user) return next()
  return response.status(401).json({ message: 'Please sign in to continue.' })
}

export function requireAdmin(request, response, next) {
  if (!request.isAuthenticated?.() || !request.user) return response.status(401).json({ message: 'Please sign in to continue.' })
  if (request.user.role !== 'admin') return response.status(403).json({ message: 'Administrator access is required.' })
  return next()
}

export const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  avatar: user.avatar || '',
  email: user.email,
  role: user.role,
  authProvider: user.authProvider,
  emailVerified: user.emailVerified !== false,
})
