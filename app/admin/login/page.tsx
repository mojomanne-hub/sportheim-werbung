'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1220] flex items-center justify-center p-6">
      <div className="bg-[#161c2c] border border-gray-800 rounded-xl p-6 w-full max-w-sm">
        <h1 className="text-xl font-bold text-white mb-4">Admin-Login</h1>
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="bg-[#0d1220] border border-gray-700 rounded-lg px-3 py-2 w-full text-gray-100 mb-3 focus:outline-none focus:border-blue-500"
        />
        {error && <p className="text-red-400 text-sm mb-3">Falsches Passwort</p>}
        <button
          onClick={handleLogin}
          className="bg-blue-600 hover:bg-blue-500 transition text-white px-4 py-2 rounded-lg w-full font-medium"
        >
          Anmelden
        </button>
      </div>
    </div>
  )
}