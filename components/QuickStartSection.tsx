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

  // Auto-create an API key if none exist
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
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to create API key:', error)
    } finally {
      setCreating(false)
    }
  }

  const envVars = {
    next: `NEXT_PUBLIC_PICOBASE_URL=${instanceUrl}
NEXT_PUBLIC_PICOBASE_API_KEY=${apiKey || 'pbk_your_api_key_here'}`,
    vite: `VITE_PICOBASE_URL=${instanceUrl}
VITE_PICOBASE_API_KEY=${apiKey || 'pbk_your_api_key_here'}`,
    node: `PICOBASE_URL=${instanceUrl}
PICOBASE_API_KEY=${apiKey || 'pbk_your_api_key_here'}`,
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                copied
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
              Creating API key...
            </div>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="mt-5 pt-5 border-t border-primary-200 dark:border-primary-800">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          What to do next:
        </p>
        <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>
              Create a <code className="px-1.5 py-0.5 bg-white dark:bg-gray-900 rounded text-xs border border-gray-200 dark:border-gray-700">.env.local</code> file in your project root
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>
              Click "Copy" above and paste the variables into your file
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>
              Install the SDK: <code className="px-1.5 py-0.5 bg-white dark:bg-gray-900 rounded text-xs border border-gray-200 dark:border-gray-700">npm install @picobase_app/client</code>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              4
            </span>
            <span>
              Start coding! Check out the{' '}
              <a href="/docs" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                docs
              </a>{' '}
              for examples
            </span>
          </li>
        </ol>
      </div>

      {/* Info Box */}
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
    </div>
  )
}
