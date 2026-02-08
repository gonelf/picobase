'use client'

import { useState, useEffect } from 'react'

interface IpAllowlistEntry {
  id: string
  ipAddress: string
  cidr?: string
  description?: string
  enabled: boolean
  createdAt: string
}

export default function IpAllowlistPanel({ instanceId }: { instanceId: string }) {
  const [entries, setEntries] = useState<IpAllowlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEntry, setNewEntry] = useState({ ipAddress: '', cidr: '', description: '' })

  useEffect(() => {
    fetchAllowlist()
  }, [instanceId])

  async function fetchAllowlist() {
    try {
      setLoading(true)
      const response = await fetch(`/api/instances/${instanceId}/ip-allowlist`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data.allowlist)
      }
    } catch (error) {
      console.error('Failed to fetch IP allowlist:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addEntry() {
    try {
      const response = await fetch(`/api/instances/${instanceId}/ip-allowlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          ...newEntry,
        }),
      })

      if (response.ok) {
        setNewEntry({ ipAddress: '', cidr: '', description: '' })
        setShowAddForm(false)
        fetchAllowlist()
      }
    } catch (error) {
      console.error('Failed to add IP:', error)
    }
  }

  async function removeEntry(entryId: string) {
    if (!confirm('Remove this IP address from the allowlist?')) return

    try {
      const response = await fetch(`/api/instances/${instanceId}/ip-allowlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', entryId }),
      })

      if (response.ok) {
        fetchAllowlist()
      }
    } catch (error) {
      console.error('Failed to remove IP:', error)
    }
  }

  async function toggleEntry(entryId: string, enabled: boolean) {
    try {
      const response = await fetch(`/api/instances/${instanceId}/ip-allowlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', entryId, enabled }),
      })

      if (response.ok) {
        fetchAllowlist()
      }
    } catch (error) {
      console.error('Failed to toggle IP:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading IP allowlist...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">IP Allowlist</h2>
          <p className="text-xs text-gray-400 mt-1">
            {entries.length === 0 ? 'All IPs are allowed by default' : `${entries.length} IP(s) configured`}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
        >
          Add IP
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">IP Address</label>
            <input
              type="text"
              value={newEntry.ipAddress}
              onChange={(e) => setNewEntry({ ...newEntry, ipAddress: e.target.value })}
              placeholder="192.168.1.100"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white text-sm rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">CIDR (optional)</label>
            <input
              type="text"
              value={newEntry.cidr}
              onChange={(e) => setNewEntry({ ...newEntry, cidr: e.target.value })}
              placeholder="192.168.1.0/24"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white text-sm rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description (optional)</label>
            <input
              type="text"
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              placeholder="Office network"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white text-sm rounded"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addEntry}
              disabled={!newEntry.ipAddress}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm rounded"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewEntry({ ipAddress: '', cidr: '', description: '' })
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr className="text-xs text-gray-400">
                <th className="px-4 py-2 text-left">IP Address / CIDR</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                  <td className="px-4 py-2 text-white font-mono">
                    {entry.ipAddress}
                    {entry.cidr && <span className="text-gray-400 ml-1">({entry.cidr})</span>}
                  </td>
                  <td className="px-4 py-2 text-gray-400">
                    {entry.description || '-'}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => toggleEntry(entry.id, !entry.enabled)}
                      className={`px-2 py-1 rounded text-xs ${
                        entry.enabled
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {entry.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
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
