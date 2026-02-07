'use client'

import { useState, useEffect } from 'react'

interface Record {
  id: string
  created: string
  updated: string
  [key: string]: any
}

interface Collection {
  id: string
  name: string
  type: string
  schema?: Array<{
    name: string
    type: string
    required: boolean
  }>
}

export default function DataBrowser({
  instanceId,
  collection,
  onBack,
}: {
  instanceId: string
  collection: Collection
  onBack: () => void
}) {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const perPage = 20

  useEffect(() => {
    fetchRecords()
  }, [collection.id, page])

  async function fetchRecords() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/instances/${instanceId}/collections/${collection.id}/records?page=${page}&perPage=${perPage}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch records')
      }

      const data = await response.json()
      setRecords(data.items || [])
      setTotalPages(Math.ceil((data.totalItems || 0) / perPage))
    } catch (err) {
      console.error('Error fetching records:', err)
      setError(err instanceof Error ? err.message : 'Failed to load records')
    } finally {
      setLoading(false)
    }
  }

  // Get visible fields (exclude system fields except id)
  const visibleFields = ['id', ...(collection.schema?.map(f => f.name) || [])]
  const displayFields = visibleFields.slice(0, 6) // Limit to 6 columns for better display

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">Loading records...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          ← Back to collections
        </button>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          <button
            onClick={fetchRecords}
            className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          ← Back to collections
        </button>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {records.length} record{records.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {displayFields.map((field) => (
                  <th
                    key={field}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {field}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayFields.length}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    {displayFields.map((field) => (
                      <td
                        key={field}
                        className="px-4 py-3 text-gray-900 dark:text-gray-100"
                      >
                        <div className="max-w-xs truncate">
                          {formatValue(record[field])}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '-'
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}
