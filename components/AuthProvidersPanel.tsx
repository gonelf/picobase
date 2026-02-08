'use client'

import { useState, useEffect } from 'react'

interface OAuth2Provider {
  name: string
  displayName: string
  clientId: string
  clientSecret: string
  authUrl: string
  tokenUrl: string
  userApiUrl: string
  enabled: boolean
}

const KNOWN_PROVIDERS: { name: string; displayName: string; authUrl: string; tokenUrl: string; userApiUrl: string }[] = [
  {
    name: 'google',
    displayName: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userApiUrl: 'https://www.googleapis.com/oauth2/v1/userinfo',
  },
  {
    name: 'github',
    displayName: 'GitHub',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userApiUrl: 'https://api.github.com/user',
  },
  {
    name: 'discord',
    displayName: 'Discord',
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userApiUrl: 'https://discord.com/api/users/@me',
  },
  {
    name: 'microsoft',
    displayName: 'Microsoft',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userApiUrl: 'https://graph.microsoft.com/v1.0/me',
  },
  {
    name: 'apple',
    displayName: 'Apple',
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    userApiUrl: '',
  },
  {
    name: 'twitter',
    displayName: 'Twitter',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userApiUrl: 'https://api.twitter.com/2/users/me',
  },
]

interface Props {
  instanceId: string
}

export default function AuthProvidersPanel({ instanceId }: Props) {
  const [providers, setProviders] = useState<OAuth2Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [editingProvider, setEditingProvider] = useState<string | null>(null)

  useEffect(() => {
    fetchProviders()
  }, [instanceId])

  async function fetchProviders() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/instances/${instanceId}/auth-settings`)

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.details || data.error || 'Failed to fetch providers')
      }

      const data = await response.json()

      // PocketBase stores OAuth2 providers in settings
      const existingProviders: Record<string, any> = {}
      if (data.settings) {
        // PocketBase stores auth providers in various formats depending on version
        // Check for named provider configs (e.g., googleAuth, githubAuth)
        for (const known of KNOWN_PROVIDERS) {
          const key = `${known.name}Auth`
          if (data.settings[key]) {
            existingProviders[known.name] = data.settings[key]
          }
        }
      }

      // Build provider list with known providers
      const providerList: OAuth2Provider[] = KNOWN_PROVIDERS.map(known => {
        const existing = existingProviders[known.name]
        return {
          name: known.name,
          displayName: known.displayName,
          clientId: existing?.clientId || '',
          clientSecret: existing?.clientSecret || '',
          authUrl: existing?.authUrl || known.authUrl,
          tokenUrl: existing?.tokenUrl || known.tokenUrl,
          userApiUrl: existing?.userApiUrl || known.userApiUrl,
          enabled: existing?.enabled || false,
        }
      })

      setProviders(providerList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers')
    } finally {
      setLoading(false)
    }
  }

  function updateProvider(name: string, updates: Partial<OAuth2Provider>) {
    setProviders(prev =>
      prev.map(p => (p.name === name ? { ...p, ...updates } : p))
    )
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Build settings payload with provider configs
      const settingsPayload: Record<string, any> = {}
      for (const provider of providers) {
        const key = `${provider.name}Auth`
        settingsPayload[key] = {
          enabled: provider.enabled,
          clientId: provider.clientId,
          clientSecret: provider.clientSecret,
          authUrl: provider.authUrl,
          tokenUrl: provider.tokenUrl,
          userApiUrl: provider.userApiUrl,
        }
      }

      const response = await fetch(`/api/instances/${instanceId}/auth-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: settingsPayload,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.details || data.error || 'Failed to save providers')
      }

      setSuccess(true)
      setEditingProvider(null)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save providers')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-gray-500">Loading OAuth2 providers...</div>
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
          <p className="text-sm text-green-400">OAuth2 providers saved successfully.</p>
        </div>
      )}

      <div className="border border-gray-800 rounded-lg bg-gray-900 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-sm font-medium text-white">OAuth2 Providers</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Enable third-party authentication for your users
          </p>
        </div>

        <div className="divide-y divide-gray-800">
          {providers.map(provider => (
            <div key={provider.name} className="px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ProviderIcon name={provider.name} />
                  <div>
                    <div className="text-sm text-white">{provider.displayName}</div>
                    {provider.enabled && provider.clientId && (
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        {provider.clientId.substring(0, 12)}...
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditingProvider(editingProvider === provider.name ? null : provider.name)}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {editingProvider === provider.name ? 'Close' : 'Configure'}
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={provider.enabled}
                    onClick={() => updateProvider(provider.name, { enabled: !provider.enabled })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      provider.enabled ? 'bg-primary-600' : 'bg-gray-700'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      provider.enabled ? 'translate-x-[18px]' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              {editingProvider === provider.name && (
                <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Client ID</label>
                    <input
                      type="text"
                      value={provider.clientId}
                      onChange={e => updateProvider(provider.name, { clientId: e.target.value })}
                      placeholder="Enter client ID"
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Client Secret</label>
                    <input
                      type="password"
                      value={provider.clientSecret}
                      onChange={e => updateProvider(provider.name, { clientSecret: e.target.value })}
                      placeholder="Enter client secret"
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Auth URL</label>
                    <input
                      type="text"
                      value={provider.authUrl}
                      onChange={e => updateProvider(provider.name, { authUrl: e.target.value })}
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Token URL</label>
                    <input
                      type="text"
                      value={provider.tokenUrl}
                      onChange={e => updateProvider(provider.name, { tokenUrl: e.target.value })}
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">User Info URL</label>
                    <input
                      type="text"
                      value={provider.userApiUrl}
                      onChange={e => updateProvider(provider.name, { userApiUrl: e.target.value })}
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none font-mono text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save Providers'}
        </button>
      </div>
    </div>
  )
}

function ProviderIcon({ name }: { name: string }) {
  const iconClass = 'w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold'

  switch (name) {
    case 'google':
      return (
        <div className={`${iconClass} bg-red-900/30 text-red-400`}>G</div>
      )
    case 'github':
      return (
        <div className={`${iconClass} bg-gray-700 text-white`}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </div>
      )
    case 'discord':
      return (
        <div className={`${iconClass} bg-indigo-900/30 text-indigo-400`}>D</div>
      )
    case 'microsoft':
      return (
        <div className={`${iconClass} bg-blue-900/30 text-blue-400`}>M</div>
      )
    case 'apple':
      return (
        <div className={`${iconClass} bg-gray-800 text-white`}>A</div>
      )
    case 'twitter':
      return (
        <div className={`${iconClass} bg-sky-900/30 text-sky-400`}>X</div>
      )
    default:
      return (
        <div className={`${iconClass} bg-gray-800 text-gray-400`}>
          {name.charAt(0).toUpperCase()}
        </div>
      )
  }
}
