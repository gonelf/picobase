'use client'

import { useState, useEffect } from 'react'
import CollectionModal from './CollectionModal'

interface Collection {
  id: string
  name: string
  type: string
  system: boolean
  schema?: Array<{
    name: string
    type: string
    required: boolean
  }>
}

export default function CollectionsList({
  instanceId,
  onSelectCollection,
}: {
  instanceId: string
  onSelectCollection?: (collection: Collection) => void
}) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchCollections()
  }, [instanceId])

  async function fetchCollections() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/instances/${instanceId}/collections`)

      if (!response.ok) {
        let errorMessage = 'Failed to fetch collections'
        try {
          const errorData = await response.json()
          if (errorData.details) {
            errorMessage = errorData.details
          } else {
            errorMessage = errorData.error || errorMessage
          }
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
      setCollections(data)
    } catch (err) {
      console.error('Error fetching collections:', err)
      setError(err instanceof Error ? err.message : 'Failed to load collections')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-gray-500">Loading collections...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchCollections}
          className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const userCollections = collections.filter(c => !c.system)
  const systemCollections = collections.filter(c => c.system)

  return (
    <div className="space-y-6">
      {showCreateModal && (
        <CollectionModal
          instanceId={instanceId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchCollections}
        />
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Collections
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-500 text-xs font-medium transition-colors"
        >
          + New Collection
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-gray-700 rounded-lg">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-sm text-gray-400 mb-2">No collections yet</p>
          <p className="text-xs text-gray-500 mb-4">Create your first collection to start storing data.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 text-sm font-medium transition-colors"
          >
            Create Collection
          </button>
        </div>
      ) : (
        <>
          {userCollections.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {userCollections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => onSelectCollection?.(collection)}
                  className="p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">
                        {collection.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {collection.type}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  {collection.schema && collection.schema.length > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      {collection.schema.length} field{collection.schema.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {systemCollections.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                System Collections
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {systemCollections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => onSelectCollection?.(collection)}
                    className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors text-left group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-400 group-hover:text-gray-200 transition-colors">
                          {collection.name}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {collection.type}
                        </p>
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-700 group-hover:text-gray-500 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
