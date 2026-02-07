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
        <div className="mb-4 p-4 bg-green-900/20 border border-green-800 rounded-lg">
          <p className="text-sm font-medium text-green-400 mb-2">
            API Key Created! Copy it now, you won&apos;t see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-900 rounded border border-green-800 text-sm font-mono text-white">
              {newKey}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newKey)
              }}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-500 text-xs font-medium transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          className="mb-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 text-sm font-medium transition-colors"
        >
          Create API Key
        </button>
      ) : (
        <form onSubmit={handleCreateKey} className="mb-4 p-4 bg-gray-900 border border-gray-800 rounded-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Key name (e.g., Production)"
              required
              className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-gray-700 text-gray-300 rounded-md hover:bg-gray-800 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {initialKeys.length === 0 ? (
        <p className="text-sm text-gray-500">No API keys yet</p>
      ) : (
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {initialKeys.map((key: any) => (
                <tr key={key.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="px-4 py-2.5 text-sm text-white">{key.name}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-gray-400">{key.key_prefix}...</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">
                    {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
