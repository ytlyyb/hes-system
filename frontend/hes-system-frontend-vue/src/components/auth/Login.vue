<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePerformanceMonitoring } from '@/composables/usePerformanceMonitoring'
import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

const { t } = useI18n()
const { measureApiResponse } = usePerformanceMonitoring()

const accountId = ref('')
const password = ref('')
const verificationCode = ref('')
const verificationProblem = ref('')
const verificationId = ref('')
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
    const { response } = await measureApiResponse('/api/v1/auth/verification-code')
    verificationProblem.value = response.data.problem
    verificationId.value = response.data.id
    verificationCode.value = ''
    verificationError.value = ''
  } catch (err) {
    ElMessage.error(t('login.error.network'))
  }
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
    const { response } = await measureApiResponse('/api/v1/auth/login', {
      method: 'POST',
      data: {
        account_id: accountId.value,
        password: password.value,
        verification_code: verificationCode.value,
        verification_id: verificationId.value,
        remember_me: rememberMe.value
      }
    })

    const { access_token, user } = response.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('preferredLanguage', user.preferred_language || 'en')
    
    if (rememberMe.value) {
      localStorage.setItem('accountId', accountId.value)
      localStorage.setItem('rememberMe', 'true')
    } else {
      localStorage.removeItem('accountId')
      localStorage.removeItem('rememberMe')
    }
    
    window.location.href = '/dashboard'
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
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
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
      <div>
        <h2 class="text-center text-2xl font-bold text-gray-900 mb-8">
          {{ t('login.title') }}
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="account-id" class="sr-only">{{ t('login.accountId') }}</label>
            <input
              id="account-id"
              v-model="accountId"
              type="text"
              required
              autocomplete="username"
              :class="[
                'appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm',
                accountIdError ? 'border-red-500' : 'border-gray-300'
              ]"
              :placeholder="t('login.accountIdPlaceholder')"
              @input="validateAccountId(accountId)"
              @blur="validateAccountId(accountId)"
            />
            <p v-if="accountIdError" class="mt-1 text-sm text-red-600">{{ accountIdError }}</p>
          </div>
          <div>
            <label for="password" class="sr-only">{{ t('login.password') }}</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              :class="[
                'appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm',
                passwordError ? 'border-red-500' : 'border-gray-300'
              ]"
              :placeholder="t('login.password')"
              @input="validatePassword(password)"
              @blur="validatePassword(password)"
            />
            <p v-if="passwordError" class="mt-1 text-sm text-red-600">{{ passwordError }}</p>
          </div>
          <div class="flex">
            <div class="flex-grow">
              <label for="verification-code" class="sr-only">{{ t('login.verificationCode') }}</label>
              <input
                id="verification-code"
                v-model="verificationCode"
                type="text"
                required
                :class="[
                  'appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-bl-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm',
                  verificationError ? 'border-red-500' : 'border-gray-300'
                ]"
                :placeholder="t('login.verificationCode')"
                @input="validateVerificationCode(verificationCode)"
                @blur="validateVerificationCode(verificationCode)"
              />
              <p v-if="verificationError" class="mt-1 text-sm text-red-600">{{ verificationError }}</p>
            </div>
            <div class="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-br-md bg-gray-50">
              <span class="text-sm text-gray-500">{{ verificationProblem }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              v-model="rememberMe"
              type="checkbox"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-900">
              {{ t('login.rememberMe') }}
            </label>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
          >
            {{ loading ? t('login.loggingIn') : t('login.submit') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
