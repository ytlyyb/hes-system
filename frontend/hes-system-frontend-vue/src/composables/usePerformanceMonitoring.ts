import { onMounted, ref } from 'vue'
import axios from 'axios'

export function usePerformanceMonitoring() {
  const isSlowPage = ref(false)
  const isSlowApi = ref(false)

  onMounted(() => {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationTiming && navigationTiming.duration > 1000) {
      console.warn('Page load time exceeded 1 second:', navigationTiming.duration.toFixed(2), 'ms')
      isSlowPage.value = true
    }
  })

  const measureApiResponse = async <T>(url: string, options?: any): Promise<{ response: T; duration: number }> => {
    const start = performance.now()
    const response = await axios(url, options)
    const duration = performance.now() - start

    if (duration > 500) {
      console.warn('API response time exceeded 500ms:', duration.toFixed(2), 'ms', url)
      isSlowApi.value = true
    }

    return { response, duration }
  }

  return {
    isSlowPage,
    isSlowApi,
    measureApiResponse
  }
}
