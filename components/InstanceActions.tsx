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
      console.error('Failed to start project:', error)
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
      console.error('Failed to stop project:', error)
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
      console.error('Failed to delete project:', error)
      setLoading(false)
    }
  }

  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900 p-5">
      <h2 className="text-sm font-medium text-white mb-4">Actions</h2>
      <div className="flex gap-3">
        {status === 'stopped' && (
          <button
            onClick={handleStart}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loading ? 'Starting...' : 'Start Project'}
          </button>
        )}
        {status === 'running' && (
          <button
            onClick={handleStop}
            disabled={loading}
            className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loading ? 'Stopping...' : 'Stop Project'}
          </button>
        )}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 border border-red-800 text-red-400 rounded-md hover:bg-red-900/20 text-sm font-medium transition-colors"
          >
            Delete Project
          </button>
        ) : (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-400">Are you sure?</span>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {loading ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 border border-gray-700 text-gray-300 rounded-md hover:bg-gray-800 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
