'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface QuickStartSectionProps {
  instanceId: string
  instanceUrl: string
  existingKeys: any[]
}

export default function QuickStartSection({
  instanceId,
  instanceUrl,
  existingKeys,
}: QuickStartSectionProps) {
  // Properly typed keys
  interface ApiKey {
    key_prefix: string
    type: 'standard' | 'admin'
    // other fields if needed
  }

  const typedExistingKeys = existingKeys as ApiKey[]

  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<'next' | 'vite' | 'node'>('next')

  // Separate state for standard and admin keys
  const [standardKey, setStandardKey] = useState<string | null>(null)
  const [adminKey, setAdminKey] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Determine if we are missing any keys
  const hasStandardKey = typedExistingKeys.some(k => k.type === 'standard' || !k.type) // Handle legacy keys without type as standard
  const hasAdminKey = typedExistingKeys.some(k => k.type === 'admin')

  // Auto-create missing keys on load
  useEffect(() => {
    if (!creating) {
      const missingStandard = !hasStandardKey && !standardKey
      const missingAdmin = !hasAdminKey && !adminKey

      if (missingStandard || missingAdmin) {
        handleAutoCreateKeys(missingStandard, missingAdmin)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStandardKey, hasAdminKey])

  async function handleAutoCreateKeys(createStandard: boolean, createAdmin: boolean) {
    setCreating(true)
    try {
      if (createStandard) {
        await createKey('Quick Start Key', 'standard', setStandardKey)
      }
      if (createAdmin) {
        await createKey('Quick Start Admin Key', 'admin', setAdminKey)
      }
      router.refresh()
    } catch (error) {
      console.error('Failed to create API keys:', error)
    } finally {
      setCreating(false)
    }
  }

  async function createKey(name: string, type: 'standard' | 'admin', setter: (key: string) => void): Promise<string | null> {
    try {
      const response = await fetch(`/api/instances/${instanceId}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      })

      const data = await response.json()
      if (response.ok) {
        setter(data.key)
        return data.key
      }
    } catch (error) {
      console.error('Failed to create API key:', error)
    }
    return null
  }

  // Determine display values
  const displayStandardKey = standardKey ||
    (hasStandardKey ? `${typedExistingKeys.find(k => k.type === 'standard' || !k.type)?.key_prefix}...` : 'pbk_standard_key')

  const displayAdminKey = adminKey ||
    (hasAdminKey ? `${typedExistingKeys.find(k => k.type === 'admin')?.key_prefix}...` : 'pbk_admin_key')

  const envVars = {
    next: `NEXT_PUBLIC_PICOBASE_URL=${instanceUrl}
NEXT_PUBLIC_PICOBASE_API_KEY=${displayStandardKey}

# Admin API Key (Keep this secret! Do not expose to client)
PICOBASE_ADMIN_API_KEY=${displayAdminKey}`,
    vite: `VITE_PICOBASE_URL=${instanceUrl}
VITE_PICOBASE_API_KEY=${displayStandardKey}

# Admin API Key (Keep this secret! Do not expose to client)
PICOBASE_ADMIN_API_KEY=${displayAdminKey}`,
    node: `PICOBASE_URL=${instanceUrl}
PICOBASE_API_KEY=${displayStandardKey}

# Admin API Key (Keep this secret! Do not expose to client)
PICOBASE_ADMIN_API_KEY=${displayAdminKey}`,
  }

  const getEnvVars = (stdKey: string, admKey: string) => ({
    next: `NEXT_PUBLIC_PICOBASE_URL=${instanceUrl}
NEXT_PUBLIC_PICOBASE_API_KEY=${stdKey}

# Admin API Key (Keep this secret! Do not expose to client)
PICOBASE_ADMIN_API_KEY=${admKey}`,
    vite: `VITE_PICOBASE_URL=${instanceUrl}
VITE_PICOBASE_API_KEY=${stdKey}

# Admin API Key (Keep this secret! Do not expose to client)
PICOBASE_ADMIN_API_KEY=${admKey}`,
    node: `PICOBASE_URL=${instanceUrl}
PICOBASE_API_KEY=${stdKey}

# Admin API Key (Keep this secret! Do not expose to client)
PICOBASE_ADMIN_API_KEY=${admKey}`,
  })

  async function copyToClipboard() {
    let currentStandardKey = standardKey
    let currentAdminKey = adminKey

    // If keys are masked or missing, generate new ones
    if (!currentStandardKey && hasStandardKey) {
      setCreating(true)
      currentStandardKey = await createKey('Quick Start Key', 'standard', setStandardKey)
    }
    if (!currentAdminKey && hasAdminKey) {
      setCreating(true)
      currentAdminKey = await createKey('Quick Start Admin Key', 'admin', setAdminKey)
    }
    setCreating(false)

    // Fallback if generation failed or keys still missing (shouldn't happen often)
    const finalStandardKey = currentStandardKey ||
      (hasStandardKey ? `${typedExistingKeys.find(k => k.type === 'standard' || !k.type)?.key_prefix}...` : 'pbk_standard_key')

    const finalAdminKey = currentAdminKey ||
      (hasAdminKey ? `${typedExistingKeys.find(k => k.type === 'admin')?.key_prefix}...` : 'pbk_admin_key')

    const vars = getEnvVars(finalStandardKey, finalAdminKey)
    const text = vars[selectedTab]

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        return
      }
    } catch (err) {
      console.log('Clipboard API failed, trying fallback method')
    }

    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const successful = document.execCommand('copy')
      textArea.remove()

      if (successful) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Fallback copy failed:', err)
    }
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-950 dark:to-accent-950 rounded-lg border-2 border-primary-200 dark:border-primary-800 p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-5">
        <div className="flex-shrink-0 w-10 h-10 bg-primary-600 dark:bg-primary-500 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Quick Start — Copy & Paste to Get Started
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Add these to your <code className="px-1.5 py-0.5 bg-white dark:bg-gray-900 rounded text-xs border border-gray-200 dark:border-gray-700">.env.local</code> file and you're ready to code! 🚀
          </p>
        </div>
      </div>

      {/* Framework Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedTab('next')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedTab === 'next'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
          Next.js
        </button>
        <button
          onClick={() => setSelectedTab('vite')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedTab === 'vite'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
          Vite
        </button>
        <button
          onClick={() => setSelectedTab('node')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedTab === 'node'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
          Node.js
        </button>
      </div>

      {/* Environment Variables Display */}
      <div className="relative">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-start justify-between gap-4 mb-2">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Your .env.local file
            </span>
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${copied
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="text-sm font-mono text-green-400 leading-relaxed whitespace-pre-wrap break-all">
            {envVars[selectedTab]}
          </pre>
        </div>

        {creating && (
          <div className="absolute inset-0 bg-gray-900/50 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2 text-white text-sm">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating API keys...
            </div>
          </div>
        )}
      </div>

      {/* Detailed Info / Masked Key Warning */}
      {(!standardKey || !adminKey) && !creating && (
        <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
          <div className="flex gap-2 items-start">
            <svg className="flex-shrink-0 w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-blue-100 font-medium mb-2">
                Existing keys are masked for security. Create new keys to handle rotation or if you lost them.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAutoCreateKeys(true, true)}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors font-medium"
                >
                  Create New Keys
                </button>
                <a
                  href={`/dashboard/projects/${instanceId}/api-keys`}
                  className="text-xs px-3 py-1.5 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors font-medium"
                >
                  View All Keys
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Key Warning */}
      <div className="mt-4 p-3 bg-amber-900/20 border border-amber-800 rounded-lg">
        <div className="flex gap-2">
          <svg className="flex-shrink-0 w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-amber-100">
            <strong>Warning:</strong> The <code>PICOBASE_ADMIN_API_KEY</code> has full access to your instance. Never expose it to the client-side browser or public repositories.
          </p>
        </div>
      </div>
    </div>
  )
}
