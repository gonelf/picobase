'use client'

import { useState, useEffect } from 'react'

interface HealthCheck {
  instanceId: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTimeMs: number
  timestamp: string
  errorMessage?: string
}

interface HealthMetrics {
  avgResponseTime: number
  errorRate: number
  uptime: number
  lastCheckAt: string
}

interface HealthData {
  metrics: HealthMetrics | null
  recentChecks: HealthCheck[]
}

export default function HealthMonitor({ instanceId }: { instanceId: string }) {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealthData()
    const interval = setInterval(fetchHealthData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [instanceId])

  async function fetchHealthData() {
    try {
      setLoading(true)
      const response = await fetch(`/api/instances/${instanceId}/health`)
      if (response.ok) {
        const data = await response.json()
        setHealthData(data)
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading health data...</div>
      </div>
    )
  }

  if (!healthData?.metrics) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">No health data available yet</div>
        <p className="text-xs text-gray-600 mt-2">Health checks will appear once monitoring starts</p>
      </div>
    )
  }

  const { metrics, recentChecks } = healthData
  const latestCheck = recentChecks[0]

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Instance Health</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              latestCheck?.status === 'healthy' ? 'bg-green-500' :
              latestCheck?.status === 'degraded' ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
            <span className="text-sm text-gray-300 capitalize">{latestCheck?.status || 'Unknown'}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Uptime</div>
            <div className="text-xl font-bold text-white">{metrics.uptime.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Avg Response Time</div>
            <div className="text-xl font-bold text-white">{metrics.avgResponseTime.toFixed(0)}ms</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Error Rate</div>
            <div className={`text-xl font-bold ${
              metrics.errorRate > 5 ? 'text-red-400' : 'text-green-400'
            }`}>
              {metrics.errorRate.toFixed(2)}%
            </div>
          </div>
        </div>

        {latestCheck?.errorMessage && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded text-xs text-red-400">
            {latestCheck.errorMessage}
          </div>
        )}
      </div>

      {/* Recent Checks */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Recent Health Checks</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentChecks.map((check, i) => (
            <div key={i} className="flex items-center justify-between text-xs p-2 hover:bg-gray-700/50 rounded">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  check.status === 'healthy' ? 'bg-green-500' :
                  check.status === 'degraded' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <span className="text-gray-300">{new Date(check.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-4 text-gray-400">
                <span>{check.responseTimeMs}ms</span>
                {check.errorMessage && (
                  <span className="text-red-400 truncate max-w-xs">{check.errorMessage}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
