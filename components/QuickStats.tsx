'use client'

import { useState, useEffect } from 'react'

interface Stats {
  totalCollections: number
  userCollections: number
  systemCollections: number
  totalRecords: number
  collectionStats: Array<{ name: string; count: number }>
}

export default function QuickStats({ instanceId }: { instanceId: string }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [instanceId])

  async function fetchStats() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/instances/${instanceId}/stats`)

      if (!response.ok) {
        let errorMessage = 'Failed to fetch stats'
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
      setStats(data)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">Loading stats...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Total Collections
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {stats.totalCollections}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {stats.userCollections} user, {stats.systemCollections} system
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Total Records
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {stats.totalRecords.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Across all collections
        </div>
      </div>

      {stats.collectionStats.slice(0, 2).map((collection) => (
        <div
          key={collection.name}
          className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">
            {collection.name}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {collection.count.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            records
          </div>
        </div>
      ))}
    </div>
  )
}
