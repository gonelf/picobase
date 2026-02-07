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
          // Combine error and details for better context
          if (errorData.details) {
            errorMessage = errorData.details
          } else {
            errorMessage = errorData.error || errorMessage
          }
        } catch (e) {
          // If JSON parsing fails, try to get text
          try {
            const errorText = await response.text()
            if (errorText) errorMessage = errorText
          } catch {
            // If all else fails, use status text
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
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">Loading collections...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        <button
          onClick={fetchCollections}
          className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (collections.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        <p>No collections found. Create your first collection in the PocketBase admin.</p>
      </div>
    )
  }

  const userCollections = collections.filter(c => !c.system)
  const systemCollections = collections.filter(c => c.system)

  return (
    <div className="space-y-6">
      {userCollections.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Collections
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {userCollections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => onSelectCollection?.(collection)}
                className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {collection.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {collection.type}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 dark:text-gray-500"
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
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
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
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            System Collections
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {systemCollections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => onSelectCollection?.(collection)}
                className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">
                      {collection.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {collection.type}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 dark:text-gray-500"
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
