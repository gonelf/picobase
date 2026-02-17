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
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<'next' | 'vite' | 'node'>('next')
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showCreateNew, setShowCreateNew] = useState(false)

  // Use existing key if available, otherwise auto-create
  useEffect(() => {
    if (existingKeys.length === 0 && !creating && !apiKey) {
      handleAutoCreateKey()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingKeys.length])

  async function handleAutoCreateKey() {
    setCreating(true)
    try {
      const response = await fetch(`/api/instances/${instanceId}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Quick Start Key' }),
      })

      const data = await response.json()

      if (response.ok) {
        setApiKey(data.key)
        setShowCreateNew(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to create API key:', error)
    } finally {
      setCreating(false)
    }
  }

  // Use the newly created key, or show placeholder that references existing keys
  const displayKey = apiKey || (existingKeys.length > 0 ? `${existingKeys[0].key_prefix}...` : 'pbk_your_api_key_here')
  const hasExistingKeys = existingKeys.length > 0

  const envVars = {
    next: `NEXT_PUBLIC_PICOBASE_URL=${instanceUrl}
NEXT_PUBLIC_PICOBASE_API_KEY=${displayKey}`,
    vite: `VITE_PICOBASE_URL=${instanceUrl}
VITE_PICOBASE_API_KEY=${displayKey}`,
    node: `PICOBASE_URL=${instanceUrl}
PICOBASE_API_KEY=${displayKey}`,
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(envVars[selectedTab])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add these to your <code className="px-1.5 py-0.5 bg-white dark:bg-gray-900 rounded text-xs border border-gray-200 dark:border-gray-700">.env.local</code> file and you're ready to code! 🚀
          </p>
        </div>
      </div>

      {/* Framework Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedTab('next')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedTab === 'next'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Next.js
        </button>
        <button
          onClick={() => setSelectedTab('vite')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedTab === 'vite'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Vite
        </button>
        <button
          onClick={() => setSelectedTab('node')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedTab === 'node'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Node.js
        </button>
      </div>

      {/* Environment Variables Display */}
      <div className="relative">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-start justify-between gap-4 mb-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Your .env.local file
            </span>
            <button
              onClick={copyToClipboard}
              disabled={hasExistingKeys && !apiKey}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                copied
                  ? 'bg-green-600 text-white'
                  : hasExistingKeys && !apiKey
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
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

        {/* Info message for existing keys */}
        {hasExistingKeys && !apiKey && !creating && (
          <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
            <div className="flex gap-2 items-start">
              <svg className="flex-shrink-0 w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-blue-200 mb-2">
                  You have an existing API key. For security reasons, we only show the full key once when it's created.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateNew(true)}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors font-medium"
                  >
                    Create New Key
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

        {/* Create new key confirmation */}
        {showCreateNew && (
          <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-200 mb-3">
              Create a new API key? Your existing keys will remain active.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleAutoCreateKey}
                disabled={creating}
                className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded hover:bg-primary-500 transition-colors font-medium disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Yes, Create Key'}
              </button>
              <button
                onClick={() => setShowCreateNew(false)}
                className="text-xs px-3 py-1.5 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {creating && (
          <div className="absolute inset-0 bg-gray-900/50 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2 text-white text-sm">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating API key...
            </div>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="mt-6 pt-6 border-t border-primary-200 dark:border-primary-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Next Steps
        </h3>
        <ol className="space-y-4">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
              1
            </span>
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                Create a <code className="px-2 py-1 bg-white dark:bg-gray-900 rounded text-xs font-mono border border-gray-300 dark:border-gray-700 text-primary-600 dark:text-primary-400">.env.local</code> file in your project root
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
              2
            </span>
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                Click "Copy" above and paste the variables into your file
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
              3
            </span>
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed mb-2">
                Install the SDK:
              </p>
              <code className="block px-3 py-2 bg-gray-900 dark:bg-black rounded text-sm font-mono border border-gray-700 dark:border-gray-800 text-green-400">
                npm install @picobase_app/client
              </code>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
              4
            </span>
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                Start coding! Check out the{' '}
                <a href="/docs" className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">
                  documentation
                </a>{' '}
                for examples
              </p>
            </div>
          </li>
        </ol>
      </div>

      {/* Info Box - only show if we have a full key to display */}
      {(apiKey || !hasExistingKeys) && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex gap-2">
            <svg className="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Keep your API key safe!</strong> Never commit your <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">.env.local</code> file to git. Add it to your <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">.gitignore</code> to keep it private.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
