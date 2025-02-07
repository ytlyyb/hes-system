import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '../i18n'
import { usePerformanceMonitoring, measureApiResponse } from '@/utils/performance'

export default function Login() {
  usePerformanceMonitoring()
  const { t, i18n } = useTranslation()
  const [accountId, setAccountId] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationProblem, setVerificationProblem] = useState('')
  const [verificationId, setVerificationId] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [language, setLanguage] = useState(localStorage.getItem('preferredLanguage') || 'en')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchVerificationProblem = async () => {
    try {
      const { response } = await measureApiResponse(`${import.meta.env.VITE_API_URL}/api/v1/auth/verification-code`)
      if (response.ok) {
        const data = await response.json()
        setVerificationProblem(data.problem)
        setVerificationId(data.id)
        setVerificationCode('')
      }
    } catch (error) {
      console.error('Failed to fetch verification code:', error)
    }
  }

  useEffect(() => {
    fetchVerificationProblem()
    const savedAccountId = localStorage.getItem('accountId')
    if (savedAccountId) {
      setAccountId(savedAccountId)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { response } = await measureApiResponse(`${import.meta.env.VITE_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: accountId,
          password,
          verification_code: verificationCode,
          verification_id: verificationId,
          remember_me: rememberMe
        }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.access_token)
        if (rememberMe) {
          localStorage.setItem('accountId', accountId)
        } else {
          localStorage.removeItem('accountId')
        }
        window.location.href = '/dashboard'
      } else {
        setError(data.detail || t('login.error.generic'))
        fetchVerificationProblem()
      }
    } catch (error) {
      setError(t('login.error.network'))
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('preferredLanguage', lang)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('login.title')}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">{t('login.accountId')}</label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                pattern="^[A-Za-z_]{6,25}$"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                placeholder={t('login.accountIdPlaceholder')}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">{t('login.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                maxLength={25}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">{t('login.verificationCode')}</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder={verificationProblem}
                  required
                />
                <button
                  type="button"
                  onClick={fetchVerificationProblem}
                  className="mt-1 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                {t('login.rememberMe')}
              </label>
            </div>

            <div className="flex items-center">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? t('login.loggingIn') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
