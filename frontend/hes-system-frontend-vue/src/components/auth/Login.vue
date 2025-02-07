<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePerformanceMonitoring } from '@/composables/usePerformanceMonitoring'
import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import WavePattern from '@/components/ui/WavePattern.vue'
import bgImage from '@/assets/images/bg_b.gif'
import 'element-plus/es/components/message/style/css'

const { t } = useI18n()
const { measureApiResponse } = usePerformanceMonitoring()

const accountId = ref('')
const password = ref('')
const verificationCode = ref('')
const verificationCodeUrl = ref('http://47.240.10.58:20001/login/getCodeImg')
const rememberMe = ref(false)
const loading = ref(false)

const accountIdError = ref('')
const passwordError = ref('')
const verificationError = ref('')

const validateAccountId = (value: string) => {
  if (!value) {
    accountIdError.value = t('login.error.accountId')
    return false
  }
  const isValid = /^[A-Za-z_]{6,25}$/.test(value)
  accountIdError.value = isValid ? '' : t('login.error.accountId')
  return isValid
}

const validatePassword = (value: string) => {
  if (!value || value.length < 6 || value.length > 25) {
    passwordError.value = t('login.error.password')
    return false
  }
  passwordError.value = ''
  return true
}

const validateVerificationCode = (value: string) => {
  if (!value) {
    verificationError.value = t('login.error.verification')
    return false
  }
  verificationError.value = ''
  return true
}

const fetchVerificationCode = async () => {
  try {
    const { response } = await measureApiResponse('/login/getCodeImg', {
      method: 'GET'
    })
    const { data } = response
    console.log('Verification code response:', data)
    if (data.code === 200 && data.img) {
      verificationCodeUrl.value = `data:image/png;base64,${data.img}`
      localStorage.setItem('uniqueNumber', data.uuid || '')
      console.log('Verification code fetched successfully')
    } else {
      console.error('Failed to fetch verification code:', data)
      ElMessage.error(t('login.error.verification'))
    }
  } catch (err) {
    ElMessage.error(t('login.error.network'))
  }
  verificationCode.value = ''
  verificationError.value = ''
}

const handleSubmit = async () => {
  const isAccountIdValid = validateAccountId(accountId.value)
  const isPasswordValid = validatePassword(password.value)
  const isVerificationValid = validateVerificationCode(verificationCode.value)

  if (!isAccountIdValid || !isPasswordValid || !isVerificationValid) {
    return
  }

  loading.value = true

  try {
    console.log('Submitting login form with:', {
      username: accountId.value,
      verifyCode: verificationCode.value,
      uniqueNumber: localStorage.getItem('uniqueNumber')
    })
    
    const uniqueNumber = localStorage.getItem('uniqueNumber')
    console.log('Attempting login with:', {
      username: accountId.value,
      verifyCode: verificationCode.value,
      uniqueNumber,
      rememberMe: rememberMe.value
    })
    
    const { response } = await measureApiResponse('/login/doLogin', {
      method: 'POST',
      data: {
        username: accountId.value,
        password: password.value,
        verifyCode: verificationCode.value,
        rememberMe: rememberMe.value.toString(),
        uniqueNumber: uniqueNumber || ''
      }
    })
    
    console.log('Login response:', response.data)

    const { data } = response
    if (data.code === 200) {
      localStorage.setItem('token', data.data.token)
      localStorage.setItem('user', JSON.stringify(data.data))
      localStorage.setItem('preferredLanguage', 'en')
      
      if (rememberMe.value) {
        localStorage.setItem('accountId', accountId.value)
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('accountId')
        localStorage.removeItem('rememberMe')
      }
      
      window.location.href = '/dashboard'
    } else {
      ElMessage.error(data.msg || t('login.error.generic'))
      fetchVerificationCode()
    }
  } catch (err: any) {
    if (err.response?.status === 429) {
      ElMessage.error(t('login.error.tooManyAttempts'))
    } else if (err.response?.status === 401) {
      ElMessage.error(t('login.error.generic'))
    } else {
      ElMessage.error(t('login.error.network'))
    }
    fetchVerificationCode()
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
                <div class="flex items-center justify-center px-4 border border-l-0 border-form-border rounded-r-button bg-gray-50 min-w-[100px] h-[42px] cursor-pointer" @click="fetchVerificationCode">
                  <img :src="verificationCodeUrl" alt="Verification Code" class="h-full object-contain" />
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
