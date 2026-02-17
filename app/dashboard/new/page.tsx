'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewProject() {
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
        const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || 'An error occurred')
        setError(errorMessage)
        return
      }

      // Redirect to Quick Start page to show the new API key
      router.push(`/dashboard/instances/${data.id}`)
      router.refresh()
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          &larr; Back to projects
        </Link>
        <h1 className="text-xl font-semibold text-white mt-4">
          Create a new project
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Your project will have its own dedicated PocketBase instance.
        </p>
      </div>

      <div className="border border-gray-800 rounded-lg bg-gray-900 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Project Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="My Project"
            />
          </div>

          <div>
            <label
              htmlFor="subdomain"
              className="block text-sm font-medium text-gray-300 mb-1.5"
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
                className="flex-1 rounded-l-md border border-r-0 border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="my-project"
                pattern="[a-z0-9\-]+"
              />
              <span className="rounded-r-md border border-l-0 border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-500">
                .picobase.io
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-900/30 border border-red-800 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-primary-600 px-4 py-2 text-sm text-white font-medium hover:bg-primary-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-gray-700 text-gray-300 rounded-md hover:bg-gray-800 text-sm font-medium transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
