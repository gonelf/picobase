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

  useEffect(() => {
    fetchStats()
  }, [instanceId])

  async function fetchStats() {
    setLoading(true)
    try {
      const response = await fetch(`/api/instances/${instanceId}/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return null
  }

  return (
    <div className="flex items-center gap-4 text-xs text-gray-500">
      <span>{stats.totalCollections} collections</span>
      <span className="w-px h-3 bg-gray-700" />
      <span>{stats.totalRecords.toLocaleString()} records</span>
    </div>
  )
}
