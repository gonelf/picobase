'use client'

import { useState, useEffect } from 'react'

interface AuthOptions {
  allowEmailAuth: boolean
  allowUsernameAuth: boolean
  requireEmail: boolean
  minPasswordLength: number
  onlyVerified: boolean
  exceptEmailDomains: string[]
  onlyEmailDomains: string[]
}

interface TokenConfig {
  recordAuthToken: { duration: number }
  recordVerificationToken: { duration: number }
  recordPasswordResetToken: { duration: number }
  recordEmailChangeToken: { duration: number }
}

interface Props {
  instanceId: string
}

const DEFAULT_AUTH_OPTIONS: AuthOptions = {
  allowEmailAuth: true,
  allowUsernameAuth: true,
  requireEmail: false,
  minPasswordLength: 8,
  onlyVerified: false,
  exceptEmailDomains: [],
  onlyEmailDomains: [],
}

const DEFAULT_TOKENS: TokenConfig = {
  recordAuthToken: { duration: 1209600 },
  recordVerificationToken: { duration: 604800 },
  recordPasswordResetToken: { duration: 1800 },
  recordEmailChangeToken: { duration: 1800 },
}

function durationToLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

const DURATION_OPTIONS = [
  { label: '30 minutes', value: 1800 },
  { label: '1 hour', value: 3600 },
  { label: '12 hours', value: 43200 },
  { label: '1 day', value: 86400 },
  { label: '7 days', value: 604800 },
  { label: '14 days', value: 1209600 },
  { label: '30 days', value: 2592000 },
  { label: '90 days', value: 7776000 },
]

export default function AuthSettingsPanel({ instanceId }: Props) {
  const [authOptions, setAuthOptions] = useState<AuthOptions>(DEFAULT_AUTH_OPTIONS)
  const [tokens, setTokens] = useState<TokenConfig>(DEFAULT_TOKENS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [domainInput, setDomainInput] = useState('')
  const [domainType, setDomainType] = useState<'only' | 'except'>('only')

  useEffect(() => {
    fetchSettings()
  }, [instanceId])

  async function fetchSettings() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/instances/${instanceId}/auth-settings`)

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.details || data.error || 'Failed to fetch settings')
      }

      const data = await response.json()

      if (data.collection?.options) {
        const opts = data.collection.options
        setAuthOptions({
          allowEmailAuth: opts.allowEmailAuth ?? DEFAULT_AUTH_OPTIONS.allowEmailAuth,
          allowUsernameAuth: opts.allowUsernameAuth ?? DEFAULT_AUTH_OPTIONS.allowUsernameAuth,
          requireEmail: opts.requireEmail ?? DEFAULT_AUTH_OPTIONS.requireEmail,
          minPasswordLength: opts.minPasswordLength ?? DEFAULT_AUTH_OPTIONS.minPasswordLength,
          onlyVerified: opts.onlyVerified ?? DEFAULT_AUTH_OPTIONS.onlyVerified,
          exceptEmailDomains: opts.exceptEmailDomains ?? [],
          onlyEmailDomains: opts.onlyEmailDomains ?? [],
        })
      }

      if (data.settings) {
        setTokens({
          recordAuthToken: data.settings.recordAuthToken ?? DEFAULT_TOKENS.recordAuthToken,
          recordVerificationToken: data.settings.recordVerificationToken ?? DEFAULT_TOKENS.recordVerificationToken,
          recordPasswordResetToken: data.settings.recordPasswordResetToken ?? DEFAULT_TOKENS.recordPasswordResetToken,
          recordEmailChangeToken: data.settings.recordEmailChangeToken ?? DEFAULT_TOKENS.recordEmailChangeToken,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/instances/${instanceId}/auth-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: {
            options: authOptions,
          },
          settings: tokens,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.details || data.error || 'Failed to save settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  function addDomain() {
    const domain = domainInput.trim().toLowerCase()
    if (!domain) return

    if (domainType === 'only') {
      if (!authOptions.onlyEmailDomains.includes(domain)) {
        setAuthOptions(prev => ({
          ...prev,
          onlyEmailDomains: [...prev.onlyEmailDomains, domain],
        }))
      }
    } else {
      if (!authOptions.exceptEmailDomains.includes(domain)) {
        setAuthOptions(prev => ({
          ...prev,
          exceptEmailDomains: [...prev.exceptEmailDomains, domain],
        }))
      }
    }
    setDomainInput('')
  }

  function removeDomain(domain: string, type: 'only' | 'except') {
    if (type === 'only') {
      setAuthOptions(prev => ({
        ...prev,
        onlyEmailDomains: prev.onlyEmailDomains.filter(d => d !== domain),
      }))
    } else {
      setAuthOptions(prev => ({
        ...prev,
        exceptEmailDomains: prev.exceptEmailDomains.filter(d => d !== domain),
      }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-gray-500">Loading auth settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
          <p className="text-sm text-green-400">Settings saved successfully.</p>
        </div>
      )}

      {/* Identity Methods */}
      <div className="border border-gray-800 rounded-lg bg-gray-900 p-5">
        <h3 className="text-sm font-medium text-white mb-4">Identity Methods</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Email/Password</div>
              <div className="text-xs text-gray-500">Allow users to sign up with email and password</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={authOptions.allowEmailAuth}
              onClick={() => setAuthOptions(prev => ({ ...prev, allowEmailAuth: !prev.allowEmailAuth }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                authOptions.allowEmailAuth ? 'bg-primary-600' : 'bg-gray-700'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                authOptions.allowEmailAuth ? 'translate-x-[18px]' : 'translate-x-1'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Username/Password</div>
              <div className="text-xs text-gray-500">Allow users to sign up with username and password</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={authOptions.allowUsernameAuth}
              onClick={() => setAuthOptions(prev => ({ ...prev, allowUsernameAuth: !prev.allowUsernameAuth }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                authOptions.allowUsernameAuth ? 'bg-primary-600' : 'bg-gray-700'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                authOptions.allowUsernameAuth ? 'translate-x-[18px]' : 'translate-x-1'
              }`} />
            </button>
          </label>
        </div>
      </div>

      {/* Requirements */}
      <div className="border border-gray-800 rounded-lg bg-gray-900 p-5">
        <h3 className="text-sm font-medium text-white mb-4">Requirements</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Require email</div>
              <div className="text-xs text-gray-500">Require an email address for all auth records</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={authOptions.requireEmail}
              onClick={() => setAuthOptions(prev => ({ ...prev, requireEmail: !prev.requireEmail }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                authOptions.requireEmail ? 'bg-primary-600' : 'bg-gray-700'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                authOptions.requireEmail ? 'translate-x-[18px]' : 'translate-x-1'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Only verified</div>
              <div className="text-xs text-gray-500">Only allow verified users to authenticate</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={authOptions.onlyVerified}
              onClick={() => setAuthOptions(prev => ({ ...prev, onlyVerified: !prev.onlyVerified }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                authOptions.onlyVerified ? 'bg-primary-600' : 'bg-gray-700'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                authOptions.onlyVerified ? 'translate-x-[18px]' : 'translate-x-1'
              }`} />
            </button>
          </label>

          <div>
            <label className="block text-sm text-white mb-1.5">Minimum password length</label>
            <input
              type="number"
              min={5}
              max={72}
              value={authOptions.minPasswordLength}
              onChange={e => setAuthOptions(prev => ({ ...prev, minPasswordLength: parseInt(e.target.value) || 8 }))}
              className="w-24 rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 5, maximum 72 characters</p>
          </div>
        </div>
      </div>

      {/* Email Domain Restrictions */}
      <div className="border border-gray-800 rounded-lg bg-gray-900 p-5">
        <h3 className="text-sm font-medium text-white mb-1">Email Domain Restrictions</h3>
        <p className="text-xs text-gray-500 mb-4">Restrict which email domains can register</p>

        <div className="space-y-3">
          {/* Allowed domains */}
          {authOptions.onlyEmailDomains.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1.5">Only allow these domains:</div>
              <div className="flex flex-wrap gap-1.5">
                {authOptions.onlyEmailDomains.map(domain => (
                  <span
                    key={domain}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-900/30 text-primary-400 rounded text-xs"
                  >
                    {domain}
                    <button
                      onClick={() => removeDomain(domain, 'only')}
                      className="text-primary-500 hover:text-primary-300"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Blocked domains */}
          {authOptions.exceptEmailDomains.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1.5">Block these domains:</div>
              <div className="flex flex-wrap gap-1.5">
                {authOptions.exceptEmailDomains.map(domain => (
                  <span
                    key={domain}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-900/30 text-red-400 rounded text-xs"
                  >
                    {domain}
                    <button
                      onClick={() => removeDomain(domain, 'except')}
                      className="text-red-500 hover:text-red-300"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <select
              value={domainType}
              onChange={e => setDomainType(e.target.value as 'only' | 'except')}
              className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="only">Allow only</option>
              <option value="except">Block</option>
            </select>
            <input
              type="text"
              value={domainInput}
              onChange={e => setDomainInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDomain() } }}
              placeholder="example.com"
              className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
            />
            <button
              onClick={addDomain}
              className="px-3 py-1.5 border border-gray-700 text-gray-300 rounded-md hover:bg-gray-800 text-xs transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Token Durations */}
      <div className="border border-gray-800 rounded-lg bg-gray-900 p-5">
        <h3 className="text-sm font-medium text-white mb-1">Token Durations</h3>
        <p className="text-xs text-gray-500 mb-4">Configure how long different tokens remain valid</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white mb-1.5">
              Auth token
              <span className="text-xs text-gray-500 ml-2">({durationToLabel(tokens.recordAuthToken.duration)})</span>
            </label>
            <select
              value={tokens.recordAuthToken.duration}
              onChange={e => setTokens(prev => ({
                ...prev,
                recordAuthToken: { duration: parseInt(e.target.value) },
              }))}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none"
            >
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">How long the user session token is valid after login</p>
          </div>

          <div>
            <label className="block text-sm text-white mb-1.5">
              Verification token
              <span className="text-xs text-gray-500 ml-2">({durationToLabel(tokens.recordVerificationToken.duration)})</span>
            </label>
            <select
              value={tokens.recordVerificationToken.duration}
              onChange={e => setTokens(prev => ({
                ...prev,
                recordVerificationToken: { duration: parseInt(e.target.value) },
              }))}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none"
            >
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">How long the email verification link is valid</p>
          </div>

          <div>
            <label className="block text-sm text-white mb-1.5">
              Password reset token
              <span className="text-xs text-gray-500 ml-2">({durationToLabel(tokens.recordPasswordResetToken.duration)})</span>
            </label>
            <select
              value={tokens.recordPasswordResetToken.duration}
              onChange={e => setTokens(prev => ({
                ...prev,
                recordPasswordResetToken: { duration: parseInt(e.target.value) },
              }))}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none"
            >
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">How long the password reset link is valid</p>
          </div>

          <div>
            <label className="block text-sm text-white mb-1.5">
              Email change token
              <span className="text-xs text-gray-500 ml-2">({durationToLabel(tokens.recordEmailChangeToken.duration)})</span>
            </label>
            <select
              value={tokens.recordEmailChangeToken.duration}
              onChange={e => setTokens(prev => ({
                ...prev,
                recordEmailChangeToken: { duration: parseInt(e.target.value) },
              }))}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none"
            >
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">How long the email change confirmation link is valid</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
