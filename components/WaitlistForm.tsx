'use client'

import { useState, useEffect } from 'react'

interface WaitlistResult {
  position: number
  referralCode: string
  referralCount: number
  totalCount: number
}

export default function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<WaitlistResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      setReferralCode(ref)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          referralCode: referralCode || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      setResult(data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function getReferralUrl() {
    if (!result) return ''
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/?ref=${result.referralCode}`
  }

  async function copyReferralUrl() {
    try {
      await navigator.clipboard.writeText(getReferralUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = getReferralUrl()
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (result) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-white mb-2">#{result.position}</div>
            <p className="text-white/80 text-lg">Your position on the waitlist</p>
            <p className="text-white/60 text-sm mt-1">
              {result.totalCount} people on the waitlist
            </p>
          </div>

          <div className="border-t border-white/20 pt-6 mt-6">
            <h3 className="text-white font-semibold text-lg mb-2">
              Move up the list
            </h3>
            <p className="text-white/70 text-sm mb-4">
              Share your unique link. Each person who joins moves you up one spot.
            </p>

            {result.referralCount > 0 && (
              <p className="text-green-300 text-sm mb-4 font-medium">
                {result.referralCount} {result.referralCount === 1 ? 'person has' : 'people have'} joined through your link
              </p>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={getReferralUrl()}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm truncate"
              />
              <button
                onClick={copyReferralUrl}
                className="px-4 py-3 bg-white text-primary-700 font-semibold rounded-lg hover:bg-white/90 transition-colors whitespace-nowrap"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-5 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white placeholder-white/60 text-lg focus:outline-none focus:border-white/60 transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-4 bg-white text-primary-700 font-bold text-lg rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
        >
          {loading ? 'Joining...' : 'Join Waitlist'}
        </button>
      </div>
      {error && (
        <p className="mt-3 text-red-300 text-sm text-center">{error}</p>
      )}
      {referralCode && (
        <p className="mt-3 text-green-300 text-sm text-center">
          You were referred by a friend — you'll both benefit!
        </p>
      )}
    </form>
  )
}
