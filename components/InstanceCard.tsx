'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Instance {
  id: string
  name: string
  subdomain: string
  status: string
  port: number | null
  created_at: string
}

export default function InstanceCard({ instance }: { instance: Instance }) {
  const [status, setStatus] = useState(instance.status)
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    setLoading(true)
    try {
      const response = await fetch(`/api/instances/${instance.id}/start`, {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        setStatus('running')
      }
    } catch (error) {
      console.error('Failed to start instance:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStop() {
    setLoading(true)
    try {
      const response = await fetch(`/api/instances/${instance.id}/stop`, {
        method: 'POST',
      })
      if (response.ok) {
        setStatus('stopped')
      }
    } catch (error) {
      console.error('Failed to stop instance:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = {
    running: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    stopped: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    starting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    stopping: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  }[status] || 'bg-gray-100 text-gray-800'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {instance.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {instance.subdomain}
          </p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}
        >
          {status}
        </span>
      </div>

      {status === 'running' && instance.port && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">API Endpoint:</p>
          <p className="text-sm font-mono text-gray-900 dark:text-white">
            http://localhost:{instance.port}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {status === 'stopped' ? (
          <button
            onClick={handleStart}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? 'Starting...' : 'Start'}
          </button>
        ) : status === 'running' ? (
          <button
            onClick={handleStop}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? 'Stopping...' : 'Stop'}
          </button>
        ) : null}
        <Link
          href={`/dashboard/instances/${instance.id}`}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-center"
        >
          Manage
        </Link>
      </div>
    </div>
  )
}
