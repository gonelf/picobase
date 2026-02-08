'use client'

import { useState, useEffect } from 'react'

interface MetricsSummary {
  totalRequests: number
  avgLatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  errorRate: number
  requestsPerSecond: number
}

interface EndpointMetric {
  path: string
  count: number
  avgLatency: number
  errorRate: number
}

interface MetricsData {
  summary: MetricsSummary | null
  endpoints: EndpointMetric[]
  timeSeries: Array<{
    timestamp: string
    requests: number
    avgLatency: number
    errors: number
  }>
}

export default function MetricsDashboard({ instanceId }: { instanceId: string }) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(24)

  useEffect(() => {
    fetchMetrics()
  }, [instanceId, timeRange])

  async function fetchMetrics() {
    try {
      setLoading(true)
      const response = await fetch(`/api/instances/${instanceId}/metrics?hours=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading metrics...</div>
      </div>
    )
  }

  if (!metrics?.summary) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">No metrics data available yet</div>
        <p className="text-xs text-gray-600 mt-2">Metrics will appear once your API receives requests</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Performance Metrics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-3 py-1.5"
        >
          <option value={1}>Last Hour</option>
          <option value={6}>Last 6 Hours</option>
          <option value={24}>Last 24 Hours</option>
          <option value={168}>Last 7 Days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Total Requests</div>
          <div className="text-2xl font-bold text-white">{metrics.summary.totalRequests.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">
            {metrics.summary.requestsPerSecond.toFixed(2)} req/s
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Avg Latency</div>
          <div className="text-2xl font-bold text-white">{metrics.summary.avgLatencyMs.toFixed(0)}ms</div>
          <div className="text-xs text-gray-500 mt-1">
            P95: {metrics.summary.p95LatencyMs.toFixed(0)}ms | P99: {metrics.summary.p99LatencyMs.toFixed(0)}ms
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Error Rate</div>
          <div className={`text-2xl font-bold ${
            metrics.summary.errorRate > 5 ? 'text-red-400' : 'text-green-400'
          }`}>
            {metrics.summary.errorRate.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {metrics.summary.errorRate < 1 ? 'Excellent' : metrics.summary.errorRate < 5 ? 'Good' : 'Needs attention'}
          </div>
        </div>
      </div>

      {/* Top Endpoints */}
      {metrics.endpoints.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Top Endpoints</h3>
          <div className="space-y-2">
            {metrics.endpoints.slice(0, 10).map((endpoint, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex-1 truncate text-gray-300">{endpoint.path}</div>
                <div className="flex gap-4 text-gray-400">
                  <span>{endpoint.count} requests</span>
                  <span>{endpoint.avgLatency.toFixed(0)}ms avg</span>
                  <span className={endpoint.errorRate > 5 ? 'text-red-400' : ''}>
                    {endpoint.errorRate.toFixed(1)}% errors
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
