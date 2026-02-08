'use client'

import { useState, useEffect } from 'react'

interface AuditLogEntry {
  id: string
  userId: string
  action: string
  resourceType: string
  resourceId?: string
  ipAddress?: string
  createdAt: string
}

export default function AuditLogsPanel({ instanceId }: { instanceId: string }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [instanceId])

  async function fetchLogs() {
    try {
      setLoading(true)
      const response = await fetch(`/api/instances/${instanceId}/audit-logs?limit=50`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function exportLogs() {
    try {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const endDate = new Date().toISOString()

      window.location.href = `/api/instances/${instanceId}/audit-logs?export=csv&startDate=${startDate}&endDate=${endDate}`
    } catch (error) {
      console.error('Failed to export audit logs:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading audit logs...</div>
      </div>
    )
  }

  const actionColors: Record<string, string> = {
    create: 'text-green-400',
    delete: 'text-red-400',
    update: 'text-blue-400',
    rotate: 'text-yellow-400',
  }

  function getActionColor(action: string): string {
    for (const [key, color] of Object.entries(actionColors)) {
      if (action.includes(key)) return color
    }
    return 'text-gray-400'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Audit Logs</h2>
        <button
          onClick={exportLogs}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
        >
          Export CSV (Last 30 Days)
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">No audit logs yet</div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-900 sticky top-0">
                <tr className="text-xs text-gray-400">
                  <th className="px-4 py-2 text-left">Timestamp</th>
                  <th className="px-4 py-2 text-left">Action</th>
                  <th className="px-4 py-2 text-left">Resource</th>
                  <th className="px-4 py-2 text-left">IP Address</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                    <td className="px-4 py-2 text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className={`px-4 py-2 font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </td>
                    <td className="px-4 py-2 text-gray-300">
                      {log.resourceType}
                      {log.resourceId && (
                        <span className="text-gray-500 ml-1">({log.resourceId.substring(0, 8)})</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
