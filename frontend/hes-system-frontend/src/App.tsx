import React, { useState } from 'react'
import Login from './components/auth/Login'
import Register from './components/auth/Register'

function App() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">HES System</h1>
        {isLogin ? <Login /> : <Register />}
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-4 text-sm text-gray-600 hover:text-gray-800"
        >
          {isLogin ? "Need an account? Register" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  )
}

export default App
