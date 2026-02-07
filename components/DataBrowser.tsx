'use client'

import { useState, useEffect } from 'react'
import RecordModal from './RecordModal'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Record | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const perPage = 20

  useEffect(() => {
    fetchRecords()
  }, [collection.id, page, searchQuery])

  async function fetchRecords() {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
      })

      if (searchQuery) {
        const searchFields = collection.schema?.map(f => f.name) || []
        const filterParts = searchFields.map(field => `${field} ~ "${searchQuery}"`).join(' || ')
        if (filterParts) {
          params.append('filter', filterParts)
        }
      }

      const response = await fetch(
        `/api/instances/${instanceId}/collections/${collection.id}/records?${params.toString()}`
      )

      if (!response.ok) {
        let errorMessage = 'Failed to fetch records'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
        } catch (e) {
          try {
            const errorText = await response.text()
            if (errorText) errorMessage = errorText
          } catch {
            errorMessage = `${errorMessage} (${response.status} ${response.statusText})`
          }
        }
        throw new Error(errorMessage)
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

  async function handleDelete(recordId: string) {
    if (!confirm('Are you sure you want to delete this record?')) {
      return
    }

    setDeletingId(recordId)

    try {
      const response = await fetch(
        `/api/instances/${instanceId}/collections/${collection.id}/records/${recordId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        let errorMessage = 'Failed to delete record'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
        } catch (e) {
          try {
            const errorText = await response.text()
            if (errorText) errorMessage = errorText
          } catch {
            errorMessage = `${errorMessage} (${response.status} ${response.statusText})`
          }
        }
        throw new Error(errorMessage)
      }

      fetchRecords()
    } catch (err) {
      console.error('Error deleting record:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete record')
    } finally {
      setDeletingId(null)
    }
  }

  function handleEdit(record: Record) {
    setEditingRecord(record)
    setShowModal(true)
  }

  function handleCreate() {
    setEditingRecord(undefined)
    setShowModal(true)
  }

  function handleModalClose() {
    setShowModal(false)
    setEditingRecord(undefined)
  }

  function handleModalSuccess() {
    fetchRecords()
  }

  const visibleFields = ['id', ...(collection.schema?.map(f => f.name) || [])]
  const displayFields = visibleFields.slice(0, 8)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-gray-500">Loading records...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          &larr; Back to collections
        </button>
        <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchRecords}
            className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showModal && (
        <RecordModal
          instanceId={instanceId}
          collection={collection}
          record={editingRecord}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            &larr;
          </button>
          <h2 className="text-sm font-medium text-white">{collection.name}</h2>
          <span className="text-xs text-gray-600">
            {records.length} record{records.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={handleCreate}
          className="px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-500 text-xs font-medium transition-colors"
        >
          + New Record
        </button>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search records..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setPage(1)
          }}
          className="w-full px-3 py-2 text-sm border border-gray-800 rounded-md bg-gray-900 text-white placeholder-gray-600 focus:border-gray-700 focus:outline-none"
        />
      </div>

      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-800">
              <tr>
                {displayFields.map((field) => (
                  <th
                    key={field}
                    className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {field}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayFields.length + 1}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-900/50 transition-colors"
                  >
                    {displayFields.map((field) => (
                      <td
                        key={field}
                        className="px-4 py-2.5 text-gray-300"
                      >
                        <div className="max-w-xs truncate text-xs font-mono">
                          {formatValue(record[field])}
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-gray-500 hover:text-white text-xs transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          disabled={deletingId === record.id}
                          className="text-gray-500 hover:text-red-400 text-xs transition-colors disabled:opacity-50"
                        >
                          {deletingId === record.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
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
            className="px-3 py-1.5 text-xs border border-gray-800 rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </span>
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
