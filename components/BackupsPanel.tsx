'use client'

import { useState, useEffect } from 'react'

interface Backup {
  key: string
  size: number
  modified: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

export default function BackupsPanel({ instanceId }: { instanceId: string }) {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchBackups()
  }, [instanceId])

  async function fetchBackups() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/instances/${instanceId}/backups`)

      if (!response.ok) {
        let errorMessage = 'Failed to fetch backups'
        try {
          const errorData = await response.json()
          errorMessage = errorData.details || errorData.error || errorMessage
        } catch {
          errorMessage = `${errorMessage} (${response.status})`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setBackups(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching backups:', err)
      setError(err instanceof Error ? err.message : 'Failed to load backups')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateBackup() {
    setCreating(true)

    try {
      const name = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`

      const response = await fetch(`/api/instances/${instanceId}/backups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to create backup'
        try {
          const errorData = await response.json()
          errorMessage = errorData.details || errorData.error || errorMessage
        } catch {
          errorMessage = `${errorMessage} (${response.status})`
        }
        throw new Error(errorMessage)
      }

      fetchBackups()
    } catch (err) {
      console.error('Error creating backup:', err)
      alert(err instanceof Error ? err.message : 'Failed to create backup')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-gray-500">Loading backups...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchBackups}
          className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">Database Backups</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Create and manage backups of your PocketBase database.
          </p>
        </div>
        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50 text-xs font-medium transition-colors"
        >
          {creating ? 'Creating...' : 'Create Backup'}
        </button>
      </div>

      {backups.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-gray-700 rounded-lg">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <p className="text-sm text-gray-400 mb-1">No backups yet</p>
          <p className="text-xs text-gray-500">Create your first backup to protect your data.</p>
        </div>
      ) : (
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {backups.map((backup) => (
                <tr key={backup.key} className="hover:bg-gray-900/50 transition-colors">
                  <td className="px-4 py-2.5 text-sm text-white font-mono">{backup.key}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">{formatBytes(backup.size)}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">
                    {backup.modified ? new Date(backup.modified).toLocaleString() : '-'}
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
