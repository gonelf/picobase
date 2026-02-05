'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function InstanceActions({
  instanceId,
  status,
}: {
  instanceId: string
  status: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function handleStart() {
    setLoading(true)
    try {
      await fetch(`/api/instances/${instanceId}/start`, { method: 'POST' })
      router.refresh()
    } catch (error) {
      console.error('Failed to start instance:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStop() {
    setLoading(true)
    try {
      await fetch(`/api/instances/${instanceId}/stop`, { method: 'POST' })
      router.refresh()
    } catch (error) {
      console.error('Failed to stop instance:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await fetch(`/api/instances/${instanceId}`, { method: 'DELETE' })
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete instance:', error)
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>
      <div className="flex gap-3">
        {status === 'stopped' && (
          <button
            onClick={handleStart}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Starting...' : 'Start Instance'}
          </button>
        )}
        {status === 'running' && (
          <button
            onClick={handleStop}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Stopping...' : 'Stop Instance'}
          </button>
        )}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
          >
            Delete Instance
          </button>
        ) : (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Are you sure?</span>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
