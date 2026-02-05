'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewInstance() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subdomain }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'An error occurred')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-primary-600 hover:text-primary-700 mb-4 inline-block"
        >
          ← Back to instances
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Instance
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Set up a new PocketBase instance
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Instance Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              placeholder="My Project"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              A friendly name for your instance
            </p>
          </div>

          <div>
            <label
              htmlFor="subdomain"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Subdomain
            </label>
            <div className="flex items-center">
              <input
                type="text"
                id="subdomain"
                required
                value={subdomain}
                onChange={(e) =>
                  setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                className="flex-1 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="my-project"
                pattern="[a-z0-9-]+"
              />
              <span className="rounded-r-lg border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                .picobase.io
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-white font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Instance'}
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          What happens next?
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Your PocketBase instance will be created</li>
          <li>• You'll get API keys to access your instance</li>
          <li>• Start/stop your instance on-demand</li>
          <li>• Your data is automatically backed up to R2</li>
        </ul>
      </div>
    </div>
  )
}
