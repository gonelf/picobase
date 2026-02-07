'use client'

import { useState, useEffect } from 'react'

interface LogEntry {
  id: string
  created: string
  updated: string
  url: string
  method: string
  status: number
  auth: string
  remoteIp: string
  userIp: string
  referer: string
  userAgent: string
  meta?: Record<string, any>
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-400',
  POST: 'text-blue-400',
  PUT: 'text-yellow-400',
  PATCH: 'text-yellow-400',
  DELETE: 'text-red-400',
}

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-400'
  if (status >= 300 && status < 400) return 'text-yellow-400'
  if (status >= 400 && status < 500) return 'text-orange-400'
  if (status >= 500) return 'text-red-400'
  return 'text-gray-400'
}

export default function LogsViewer({ instanceId }: { instanceId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [filterMethod, setFilterMethod] = useState('')
  const perPage = 30

  useEffect(() => {
    fetchLogs()
  }, [instanceId, page, filterMethod])

  async function fetchLogs() {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
        sort: '-created',
      })

      if (filterMethod) {
        params.append('filter', `method = "${filterMethod}"`)
      }

      const response = await fetch(
        `/api/instances/${instanceId}/logs?${params.toString()}`
      )

      if (!response.ok) {
        let errorMessage = 'Failed to fetch logs'
        try {
          const errorData = await response.json()
          errorMessage = errorData.details || errorData.error || errorMessage
        } catch {
          errorMessage = `${errorMessage} (${response.status})`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setLogs(data.items || [])
      setTotalPages(Math.ceil((data.totalItems || 0) / perPage))
    } catch (err) {
      console.error('Error fetching logs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-gray-500">Loading logs...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchLogs}
          className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-white">Request Logs</h3>
          <button
            onClick={fetchLogs}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Refresh
          </button>
        </div>
        <select
          value={filterMethod}
          onChange={(e) => { setFilterMethod(e.target.value); setPage(1) }}
          className="px-2.5 py-1.5 text-xs border border-gray-700 rounded-md bg-gray-800 text-gray-300 focus:border-primary-500 focus:outline-none"
        >
          <option value="">All Methods</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PATCH">PATCH</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      {logs.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">No logs found</p>
          <p className="text-xs text-gray-500 mt-1">Request logs will appear here as your API is used.</p>
        </div>
      ) : (
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auth</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                    className="hover:bg-gray-900/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.created).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-mono font-medium ${METHOD_COLORS[log.method] || 'text-gray-400'}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-300 font-mono max-w-xs truncate">
                      {log.url}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-mono ${statusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">
                      {log.auth || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-mono">
                      {log.userIp || log.remoteIp || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="border border-gray-800 rounded-lg bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium text-gray-400">Log Details</h4>
            <button
              onClick={() => setSelectedLog(null)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <dt className="text-gray-500">ID</dt>
              <dd className="text-gray-300 font-mono">{selectedLog.id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Created</dt>
              <dd className="text-gray-300">{new Date(selectedLog.created).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Method</dt>
              <dd className={`font-mono ${METHOD_COLORS[selectedLog.method] || 'text-gray-300'}`}>{selectedLog.method}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd className={`font-mono ${statusColor(selectedLog.status)}`}>{selectedLog.status}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500">URL</dt>
              <dd className="text-gray-300 font-mono break-all">{selectedLog.url}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Auth</dt>
              <dd className="text-gray-300">{selectedLog.auth || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">IP</dt>
              <dd className="text-gray-300 font-mono">{selectedLog.userIp || selectedLog.remoteIp || '-'}</dd>
            </div>
            {selectedLog.referer && (
              <div className="col-span-2">
                <dt className="text-gray-500">Referer</dt>
                <dd className="text-gray-300 font-mono break-all">{selectedLog.referer}</dd>
              </div>
            )}
            {selectedLog.userAgent && (
              <div className="col-span-2">
                <dt className="text-gray-500">User Agent</dt>
                <dd className="text-gray-300 text-xs break-all">{selectedLog.userAgent}</dd>
              </div>
            )}
            {selectedLog.meta && Object.keys(selectedLog.meta).length > 0 && (
              <div className="col-span-2">
                <dt className="text-gray-500">Meta</dt>
                <dd className="text-gray-300 font-mono text-xs">
                  <pre className="mt-1 p-2 bg-gray-800 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.meta, null, 2)}
                  </pre>
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs border border-gray-800 rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs border border-gray-800 rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
