'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ApiKeysList({
  instanceId,
  initialKeys,
}: {
  instanceId: string
  initialKeys: any[]
}) {
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/instances/${instanceId}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName }),
      })

      const data = await response.json()

      if (response.ok) {
        setNewKey(data.key)
        setKeyName('')
        setShowCreateForm(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to create API key:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteKey(keyId: string) {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return
    }

    try {
      await fetch(`/api/instances/${instanceId}/keys/${keyId}`, {
        method: 'DELETE',
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to delete API key:', error)
    }
  }

  return (
    <div>
      {newKey && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
            API Key Created! Copy it now, you won't see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 rounded border border-green-200 dark:border-green-800 text-sm font-mono">
              {newKey}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newKey)
              }}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          className="mb-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
        >
          Create API Key
        </button>
      ) : (
        <form onSubmit={handleCreateKey} className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Key name (e.g., Production)"
              required
              className="flex-1 rounded border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {initialKeys.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No API keys yet</p>
      ) : (
        <div className="space-y-3">
          {initialKeys.map((key: any) => (
            <div
              key={key.id}
              className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {key.name}
                </p>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-1">
                  {key.key_prefix}...
                </p>
                {key.last_used_at && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Last used: {new Date(key.last_used_at).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeleteKey(key.id)}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
