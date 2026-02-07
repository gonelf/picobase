'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Project {
  id: string
  name: string
  subdomain: string
  status: string
  port: number | null
  created_at: string
}

export default function ProjectCard({ project }: { project: Project }) {
  const [status, setStatus] = useState(project.status)
  const [loading, setLoading] = useState(false)

  async function handleStart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    try {
      const response = await fetch(`/api/instances/${project.id}/start`, {
        method: 'POST',
      })
      if (response.ok) {
        setStatus('running')
      }
    } catch (error) {
      console.error('Failed to start project:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStop(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    try {
      const response = await fetch(`/api/instances/${project.id}/stop`, {
        method: 'POST',
      })
      if (response.ok) {
        setStatus('stopped')
      }
    } catch (error) {
      console.error('Failed to stop project:', error)
    } finally {
      setLoading(false)
    }
  }

  const isRunning = status === 'running'
  const isStopped = status === 'stopped'

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="block border border-gray-800 rounded-lg bg-gray-900 hover:border-gray-700 transition-colors group"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary-600/20 flex items-center justify-center text-primary-400 font-semibold text-sm">
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">
                {project.name}
              </h3>
              <p className="text-xs text-gray-500 font-mono">
                {project.subdomain}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : isStopped ? 'bg-gray-600' : 'bg-yellow-500 animate-pulse'}`} />
            <span className="text-xs text-gray-500 capitalize">{status}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <span className="text-xs text-gray-500">
            {new Date(project.created_at).toLocaleDateString()}
          </span>
          <div className="flex gap-2">
            {isStopped && (
              <button
                onClick={handleStart}
                disabled={loading}
                className="px-3 py-1 text-xs bg-primary-600 hover:bg-primary-500 text-white rounded transition-colors disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'Start'}
              </button>
            )}
            {isRunning && (
              <button
                onClick={handleStop}
                disabled={loading}
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors disabled:opacity-50"
              >
                {loading ? 'Stopping...' : 'Stop'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
