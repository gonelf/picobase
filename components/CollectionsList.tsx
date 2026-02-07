'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (collections.length === 0) {
    return (
      <div className="text-center p-12 text-gray-500">
        <p className="text-sm">No collections found. Create your first collection in the PocketBase admin.</p>
      </div>
    )
  }

  const userCollections = collections.filter(c => !c.system)
  const systemCollections = collections.filter(c => c.system)

  return (
    <div className="space-y-6">
      {userCollections.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Collections
          </h3>
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
    </div>
  )
}
