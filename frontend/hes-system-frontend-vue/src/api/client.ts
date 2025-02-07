import axios from 'axios'

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  withCredentials: false,
  validateStatus: (status) => {
    return status >= 200 && status < 500
  }
})

const makeLoginRequest = async (data: Record<string, any>) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value)
    })

    console.log('Making login request with data:', data)

    const request = new XMLHttpRequest()
    request.open('POST', `${BASE_URL}/login/doLogin`, true)
    request.withCredentials = true

    // Set headers before sending
    request.setRequestHeader('Accept', '*/*')
    request.setRequestHeader('Cache-Control', 'no-cache')
    request.setRequestHeader('Pragma', 'no-cache')

    // Monitor request headers
    const originalSetRequestHeader = request.setRequestHeader
    request.setRequestHeader = function(header: string, value: string) {
      console.log(`Setting header: ${header} = ${value}`)
      return originalSetRequestHeader.call(this, header, value)
    }

    request.onreadystatechange = function() {
      if (request.readyState === 1) {
        console.log('Request opened')
      } else if (request.readyState === 2) {
        console.log('Headers received:', request.getAllResponseHeaders())
      } else if (request.readyState === 3) {
        console.log('Loading response...')
      } else if (request.readyState === 4) {
        console.log('Request completed')
        if (request.status === 200) {
          try {
            const responseData = JSON.parse(request.responseText)
            console.log('Response:', responseData)
            resolve(responseData)
          } catch (error) {
            console.error('Parse error:', error)
            reject(error)
          }
        } else {
          console.error('Request failed:', request.status)
          reject(new Error('Network request failed'))
        }
      }
    }

    console.log('Sending request...')
    request.send(formData)
  })
}

// Request interceptor for data transformation
apiClient.interceptors.request.use(
  async (config) => {
    // Special handling for verification code image
    if (config.url?.includes('/login/getCodeImg')) {
      config.responseType = 'json'
      return config
    }

    // Default JSON handling for other endpoints
    if (config.data && !(config.data instanceof FormData)) {
      config.data = JSON.stringify(config.data)
      config.headers['Content-Type'] = 'application/json'
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    if (response.config.url?.includes('/login/getCodeImg')) {
      return response
    }
    console.log('Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    })
    return response
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    })
    return Promise.reject(error)
  }
)

// Rate limiting
let requestCount = 0
let resetTime = Date.now()
const MAX_REQUESTS = 60
const RESET_INTERVAL = 60000 // 1 minute

apiClient.interceptors.request.use(
  async (config) => {
    const now = Date.now()
    if (now - resetTime >= RESET_INTERVAL) {
      requestCount = 0
      resetTime = now
    }
    
    if (requestCount >= MAX_REQUESTS) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }
    
    requestCount++
    return config
  }
)

interface VerificationResponse {
  data: {
    effectiveTime: string | null
    uniqueNumber: string
    verifyImg: string
  }
  success: number
}

export const getVerificationCode = async () => {
  try {
    const response = await apiClient.get<VerificationResponse>('/login/getCodeImg', {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      validateStatus: (status) => {
        return status >= 200 && status < 500
      }
    })

    console.log('Verification code response:', response.data)

    if (!response.data || response.data.success !== 1 || !response.data.data?.verifyImg) {
      throw new Error('Invalid verification code response')
    }

    return {
      imageUrl: `data:image/png;base64,${response.data.data.verifyImg}`,
      uniqueNumber: response.data.data.uniqueNumber
    }
  } catch (error) {
    console.error('Failed to load verification code:', error)
    throw error
  }
}

export default apiClient
