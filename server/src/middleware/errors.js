export function notFound(_request, response) {
  response.status(404).json({ message: 'The requested resource was not found.' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _request, response, _next) {
  console.error(error)
  if (error?.code === 11000) return response.status(409).json({ message: 'An account with this email already exists.' })
  if (error?.name === 'ValidationError') return response.status(400).json({ message: 'Please check the submitted details.' })
  response.status(error.status || 500).json({ message: error.status ? error.message : 'An unexpected server error occurred.' })
}
