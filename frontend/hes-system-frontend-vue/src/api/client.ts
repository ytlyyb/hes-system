import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor for rate limiting
let requestCount = 0
const resetTime = Date.now()

apiClient.interceptors.request.use(
  async (config) => {
    const now = Date.now()
    if (now - resetTime >= 60000) {
      requestCount = 0
    }
    
    if (requestCount >= 60) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }
    
    requestCount++
    return config
  },
  (error) => Promise.reject(error)
)

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded:', error.response.data.detail)
    }
    return Promise.reject(error)
  }
)

export default apiClient
