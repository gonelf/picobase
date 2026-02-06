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

  const statusConfig = {
    running: {
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800',
      icon: '⚡'
    },
    stopped: {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
      icon: '⏸️'
    },
    starting: {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      icon: '🔄'
    },
    stopping: {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      icon: '🔄'
    },
    error: {
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800',
      icon: '❌'
    },
  }

  const statusInfo = statusConfig[status as keyof typeof statusConfig] || statusConfig.stopped

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 card-hover shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
              {instance.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {instance.name}
              </h3>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            {instance.subdomain}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 ${statusInfo.color}`}
        >
          <span>{statusInfo.icon}</span>
          {status}
        </span>
      </div>

      {status === 'running' && instance.port && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-primary-200 dark:border-primary-800">
          <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 mb-1">API Endpoint:</p>
          <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
            http://localhost:{instance.port}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {status === 'stopped' ? (
          <button
            onClick={handleStart}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition-all duration-300 hover:scale-105"
          >
            {loading ? 'Starting...' : '▶ Start'}
          </button>
        ) : status === 'running' ? (
          <button
            onClick={handleStop}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 hover:shadow-lg disabled:opacity-50 transition-all duration-300"
          >
            {loading ? 'Stopping...' : '⏸ Stop'}
          </button>
        ) : null}
        <Link
          href={`/dashboard/instances/${instance.id}`}
          className="flex-1 px-4 py-2.5 border-2 border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-400 rounded-lg font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 text-center"
        >
          Manage
        </Link>
      </div>
    </div>
  )
}
