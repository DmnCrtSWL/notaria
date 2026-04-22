// URL base del servidor API
// En desarrollo usa localhost, en producción usa Vercel
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default API_BASE_URL
