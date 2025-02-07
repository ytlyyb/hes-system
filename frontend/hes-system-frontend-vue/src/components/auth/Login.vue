<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePerformanceMonitoring } from '@/composables/usePerformanceMonitoring'
import apiClient, { BASE_URL } from '@/api/client'
import { ElMessage } from 'element-plus'
import { Loading, Warning } from '@element-plus/icons-vue'
import WavePattern from '@/components/ui/WavePattern.vue'
import bgImage from '@/assets/images/bg_b.gif'
import 'element-plus/es/components/message/style/css'

const { t } = useI18n()
const { measureApiResponse } = usePerformanceMonitoring()

const accountId = ref('')
const password = ref('')
const verificationCode = ref('')
const verificationCodeUrl = ref('')
const verificationImageLoading = ref(true)
const verificationImageError = ref(false)
const verificationImageRetries = ref(0)
const rememberMe = ref(false)
const loading = ref(false)
const isRateLimited = ref(false)
const rateLimitTimer = ref<number | null>(null)

const accountIdError = ref('')
const passwordError = ref('')
const verificationError = ref('')

const MAX_RETRIES = 3
const RETRY_DELAY = 2000
const RATE_LIMIT_DELAY = 5000

const validateAccountId = (value: string) => {
  if (!value) {
    accountIdError.value = t('login.error.accountId')
    return false
  }
  const isValid = /^[A-Za-z0-9_]{6,25}$/.test(value)
  if (!isValid) {
    accountIdError.value = t('login.error.accountId')
    ElMessage.error(t('login.error.accountId'))
  } else {
    accountIdError.value = ''
  }
  return isValid
}

const validatePassword = (value: string) => {
  if (!value || value.length < 6 || value.length > 25) {
    passwordError.value = t('login.error.password')
    ElMessage.error(t('login.error.password'))
    return false
  }
  passwordError.value = ''
  return true
}

const validateVerificationCode = (value: string) => {
  if (!value) {
    verificationError.value = t('login.error.verificationMissing')
    ElMessage.error(t('login.error.verificationMissing'))
    return false
  }
  verificationError.value = ''
  return true
}

const fetchVerificationCode = async () => {
  if (verificationImageRetries.value >= MAX_RETRIES) {
    console.error('Max retries reached for verification code')
    ElMessage.error(t('login.error.tooManyAttempts'))
    return
  }

  verificationImageLoading.value = true
  verificationImageError.value = false
  verificationCode.value = ''
  verificationError.value = ''
  
  try {
    const response = await fetch(`${BASE_URL}/login/getCodeImg`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    if (data.success === 1 && data.data) {
      verificationCodeUrl.value = `data:image/png;base64,${data.data.verifyImg}`
      localStorage.setItem('uniqueNumber', data.data.uniqueNumber)
      verificationImageLoading.value = false
      verificationImageError.value = false
      verificationImageRetries.value = 0
    } else {
      throw new Error('Invalid verification code response')
    }
  } catch (error) {
    console.error('Failed to fetch verification code:', error)
    verificationImageError.value = true
    verificationImageLoading.value = false
    verificationCodeUrl.value = ''

    if (error.response?.status === 429) {
      isRateLimited.value = true
      ElMessage.warning(t('login.error.tooManyVerificationRequests'))
      
      if (rateLimitTimer.value) {
        clearTimeout(rateLimitTimer.value)
      }
      
      rateLimitTimer.value = window.setTimeout(() => {
        isRateLimited.value = false
        rateLimitTimer.value = null
        verificationImageRetries.value = 0
        fetchVerificationCode()
      }, RATE_LIMIT_DELAY)
    } else {
      verificationImageRetries.value++
      if (verificationImageRetries.value < MAX_RETRIES) {
        setTimeout(() => fetchVerificationCode(), RETRY_DELAY)
      } else {
        ElMessage.error(t('login.error.verification'))
      }
    }
  }
}

const handleSubmit = async () => {
  loading.value = true

  try {
    const isAccountIdValid = validateAccountId(accountId.value)
    const isPasswordValid = validatePassword(password.value)
    const isVerificationValid = validateVerificationCode(verificationCode.value)

    if (!isAccountIdValid || !isPasswordValid || !isVerificationValid) {
      loading.value = false
      return
    }

    const uniqueNumber = localStorage.getItem('uniqueNumber')
    if (!uniqueNumber) {
      ElMessage.error(t('login.error.verification'))
      await fetchVerificationCode()
      loading.value = false
      return
    }

    const formData = new URLSearchParams()
    formData.append('username', accountId.value)
    formData.append('password', password.value)
    formData.append('verifyCode', verificationCode.value)
    formData.append('rememberMe', rememberMe.value ? '1' : '0')
    formData.append('uniqueNumber', uniqueNumber)
    
    console.log('Sending login request with data:', Object.fromEntries(formData))
    
    console.log('Sending login request with data:', Object.fromEntries(formData))
    
    const data = await makeLoginRequest({
      username: accountId.value,
      password: password.value,
      verifyCode: verificationCode.value,
      uniqueNumber: uniqueNumber,
      rememberMe: rememberMe.value ? '1' : '0'
    })
    
    if (data.success === 1) {
      if (rememberMe.value) {
        localStorage.setItem('accountId', accountId.value)
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('accountId')
        localStorage.removeItem('rememberMe')
      }

      localStorage.setItem('token', data.data.token)
      localStorage.setItem('user', JSON.stringify(data.data))
      window.location.href = '/dashboard'
    } else {
      console.error('Login failed:', data)
      if (data.errorMessage?.includes('Content type')) {
        ElMessage.error('API Error: ' + data.errorMessage)
      } else if (data.errorMessage === 'YTL_ERROR_VERIFY_CODE') {
        ElMessage.error(t('login.error.verification'))
      } else if (data.errorMessage === 'YTL_ERROR_PARAM') {
        ElMessage.error(t('login.error.invalidCredentials'))
      } else {
        ElMessage.error(t('login.error.generic'))
      }
      await fetchVerificationCode()
    }
  } catch (error) {
    console.error('Login error:', error)
    if (error.response?.status === 429) {
      ElMessage.error(t('login.error.tooManyAttempts'))
    } else {
      ElMessage.error(t('login.error.network'))
    }
    await fetchVerificationCode()
  } finally {
    loading.value = false
  }


}

onMounted(() => {
  fetchVerificationCode()
  const savedAccountId = localStorage.getItem('accountId')
  const rememberedMe = localStorage.getItem('rememberMe')
  if (savedAccountId && rememberedMe === 'true') {
    accountId.value = savedAccountId
    rememberMe.value = true
  }
})

onBeforeUnmount(() => {
  // Clean up any pending timers
  if (rateLimitTimer.value) {
    clearTimeout(rateLimitTimer.value)
    rateLimitTimer.value = null
  }
  
  // Reset state
  isRateLimited.value = false
  verificationImageRetries.value = 0
  verificationImageLoading.value = false
  verificationImageError.value = false
  
  // Clean up any blob URLs
  if (verificationCodeUrl.value && verificationCodeUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(verificationCodeUrl.value)
    verificationCodeUrl.value = ''
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center relative" :style="{ background: `url(${bgImage}) center/cover no-repeat` }">
    <WavePattern />
    
    <div class="max-w-card w-full mx-4 bg-white rounded-card shadow-xl flex overflow-hidden">
      <!-- Left side illustration -->
      <div class="w-1/2 bg-form-background p-8 hidden lg:block">
        <img src="@/assets/images/Login_illustration.png" alt="" class="w-full h-full object-contain" />
      </div>
      
      <!-- Right side form -->
      <div class="w-full lg:w-1/2 p-8">
        <div class="flex justify-end mb-4">
          <select
            class="px-2 py-1 border rounded-md text-sm"
            :value="$i18n.locale"
            @change="$i18n.locale = $event.target.value"
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </div>

        <h2 class="text-header font-bold text-gray-900 mb-8">
          {{ t('login.accountLogin') }}
        </h2>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <div>
              <label for="account-id" class="sr-only">{{ t('login.accountId') }}</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <i class="el-icon-user"></i>
                </span>
                <input
                  id="account-id"
                  v-model="accountId"
                  type="text"
                  required
                  autocomplete="username"
                  :class="[
                    'block w-full pl-10 pr-3 py-2 text-input border rounded-button placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light',
                    accountIdError ? 'border-red-500' : 'border-form-border'
                  ]"
                  :placeholder="t('login.accountIdPlaceholder')"
                  @input="validateAccountId(accountId)"
                  @blur="validateAccountId(accountId)"
                />
              </div>
              <p v-if="accountIdError" class="mt-1 text-sm text-red-600">{{ accountIdError }}</p>
            </div>

            <div>
              <label for="password" class="sr-only">{{ t('login.password') }}</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <i class="el-icon-lock"></i>
                </span>
                <input
                  id="password"
                  v-model="password"
                  type="password"
                  required
                  autocomplete="current-password"
                  :class="[
                    'block w-full pl-10 pr-3 py-2 text-input border rounded-button placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light',
                    passwordError ? 'border-red-500' : 'border-form-border'
                  ]"
                  :placeholder="t('login.password')"
                  @input="validatePassword(password)"
                  @blur="validatePassword(password)"
                />
              </div>
              <p v-if="passwordError" class="mt-1 text-sm text-red-600">{{ passwordError }}</p>
            </div>

            <div>
              <label for="verification-code" class="sr-only">{{ t('login.verificationCode') }}</label>
              <div class="flex">
                <div class="relative flex-grow">
                  <input
                    id="verification-code"
                    v-model="verificationCode"
                    type="text"
                    required
                    :class="[
                      'block w-full pr-3 py-2 text-input border rounded-l-button placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light',
                      verificationError ? 'border-red-500' : 'border-form-border'
                    ]"
                    :placeholder="t('login.verificationCode')"
                    @input="validateVerificationCode(verificationCode)"
                    @blur="validateVerificationCode(verificationCode)"
                  />
                </div>
                <div 
                  class="flex items-center justify-center px-4 border border-l-0 border-form-border rounded-r-button bg-gray-50 min-w-[100px] h-[42px] relative" 
                  :class="{ 'cursor-pointer': !isRateLimited && !verificationImageLoading, 'cursor-not-allowed': isRateLimited || verificationImageLoading }"
                  @click="!isRateLimited && !verificationImageLoading && fetchVerificationCode()"
                  role="button"
                  tabindex="0"
                  @keydown.enter="!isRateLimited && !verificationImageLoading && fetchVerificationCode()"
                  @keydown.space="!isRateLimited && !verificationImageLoading && fetchVerificationCode()"
                >
                  <div v-if="verificationImageLoading || isRateLimited" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                    <el-icon class="animate-spin mb-1"><Loading /></el-icon>
                    <span v-if="isRateLimited" class="text-xs text-gray-500 text-center px-2">
                      {{ t('login.error.tooManyVerificationRequests') }}
                    </span>
                  </div>
                  <div v-else-if="verificationImageError" class="absolute inset-0 flex items-center justify-center bg-gray-50 text-red-500">
                    <el-icon><Warning /></el-icon>
                    <span class="ml-1 text-xs">{{ t('login.error.verification') }}</span>
                  </div>
                  <img 
                    v-show="!verificationImageLoading && !verificationImageError && !isRateLimited && verificationCodeUrl"
                    :src="verificationCodeUrl" 
                    alt="Verification Code" 
                    class="h-full object-contain"
                  />
                </div>
              </div>
              <p v-if="verificationError" class="mt-1 text-sm text-red-600">{{ verificationError }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                v-model="rememberMe"
                type="checkbox"
                class="h-4 w-4 text-primary-light focus:ring-primary-light border-form-border rounded"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                {{ t('login.rememberMe') }}
              </label>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full flex justify-center py-3 px-4 text-button font-semibold rounded-button text-white bg-primary-light hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-50 transition-colors duration-200"
          >
            {{ loading ? t('login.loggingIn') : t('login.submit') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
