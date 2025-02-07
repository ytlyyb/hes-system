<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getVerificationCode } from '@/api/client'

const verificationImage = ref('')
const uniqueNumber = ref('')
const error = ref('')
const username = ref('test')
const password = ref('test123')
const verifyCode = ref('')
const loginResponse = ref('')
const isLoading = ref(false)
const isSuccess = ref(false)

const loadVerificationCode = async () => {
  try {
    const { imageUrl, uniqueNumber: number } = await getVerificationCode()
    verificationImage.value = imageUrl
    uniqueNumber.value = number
    verifyCode.value = number
    error.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load verification code'
  }
}

const attemptLogin = async () => {
  if (isLoading.value) return
  
  error.value = ''
  isLoading.value = true
  isSuccess.value = false
  
  try {
    const formData = new FormData()
    formData.append('username', username.value)
    formData.append('password', password.value)
    formData.append('verifyCode', verifyCode.value)

    console.log('Sending login request with data:', {
      username: username.value,
      password: '***',
      verifyCode: verifyCode.value
    })

    const xhr = new XMLHttpRequest()
    xhr.open('POST', 'http://47.240.10.58:20001/login/doLogin', true)
    xhr.withCredentials = true

    const response = await new Promise((resolve, reject) => {
      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            const jsonResponse = JSON.parse(xhr.responseText)
            resolve({ 
              status: xhr.status, 
              headers: xhr.getAllResponseHeaders(),
              data: jsonResponse,
              text: () => Promise.resolve(xhr.responseText)
            })
          } catch (error) {
            reject(error)
          }
        } else {
          reject(new Error('Request failed'))
        }
      }
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.send(formData)
    })

    console.log('Status:', response.status)
    console.log('Response Headers:', [...response.headers.entries()])
    
    const responseText = await response.text()
    console.log('Raw response:', responseText)
    
    const jsonResult = JSON.parse(responseText)
    console.log('Parsed response:', jsonResult)
    loginResponse.value = JSON.stringify(jsonResult, null, 2)

    if (response.status === 200 && jsonResult.success === 1) {
      error.value = ''
      isSuccess.value = true
    } else {
      error.value = jsonResult.errorMessage || jsonResult.msg || 'Login failed'
      await loadVerificationCode()
    }
  } catch (err) {
    console.error('Login error:', err)
    error.value = err instanceof Error ? err.message : 'Login failed'
    await loadVerificationCode()
  } finally {
    isLoading.value = false
  }

}

onMounted(loadVerificationCode)
</script>

<template>
  <div class="p-4">
    <h2 class="text-xl mb-4">Verification Code Test</h2>
    
    <div v-if="error" class="text-red-500 mb-4">
      {{ error }}
    </div>
    
    <div v-if="verificationImage" class="mb-4">
      <img :src="verificationImage" alt="Verification Code" class="border rounded" />
    </div>
    
    <div v-if="uniqueNumber" class="mb-4">
      <p>Unique Number: {{ uniqueNumber }}</p>
    </div>
    
    <div class="mb-4">
      <input v-model="username" placeholder="Username" class="border p-2 rounded mb-2 block" />
      <input v-model="password" type="password" placeholder="Password" class="border p-2 rounded mb-2 block" />
      <input v-model="verifyCode" placeholder="Verification Code" class="border p-2 rounded mb-2 block" />
    </div>
    
    <div class="flex gap-4">
      <button 
        @click="loadVerificationCode"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        :disabled="isLoading"
      >
        Refresh Code
      </button>
      
      <button 
        @click="attemptLogin"
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Logging in...' : 'Test Login' }}
      </button>
    </div>
    
    <div v-if="isSuccess" class="mt-4 p-4 bg-green-100 text-green-700 rounded">
      Login successful!
    </div>
    
    <div v-if="loginResponse" class="mt-4">
      <div class="p-4 bg-gray-100 rounded">
        <h3 class="font-semibold mb-2">Response Details:</h3>
        <pre class="whitespace-pre-wrap break-all">{{ loginResponse }}</pre>
      </div>
    </div>
  </div>
</template>
