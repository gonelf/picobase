'use client'

import { useState, useEffect } from 'react'

interface Alert {
  id: string
  type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  resolved: boolean
  createdAt: string
  resolvedAt?: string
}

export default function AlertsPanel({ instanceId }: { instanceId: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showResolved, setShowResolved] = useState(false)

  useEffect(() => {
    fetchAlerts()
  }, [instanceId, showResolved])

  async function fetchAlerts() {
    try {
      setLoading(true)
      const url = `/api/instances/${instanceId}/alerts${showResolved ? '' : '?active=true'}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts)
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function resolveAlert(alertId: string) {
    try {
      const response = await fetch(`/api/instances/${instanceId}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action: 'resolve' }),
      })

      if (response.ok) {
        fetchAlerts()
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    }
  }

  const activeAlerts = alerts.filter(a => !a.resolved)
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading alerts...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Alerts</h2>
          {criticalCount > 0 && (
            <span className="px-2 py-1 bg-red-900/30 border border-red-800 rounded text-xs text-red-400">
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2 py-1 bg-yellow-900/30 border border-yellow-800 rounded text-xs text-yellow-400">
              {warningCount} Warning
            </span>
          )}
        </div>
        <button
          onClick={() => setShowResolved(!showResolved)}
          className="text-xs text-gray-400 hover:text-white"
        >
          {showResolved ? 'Hide Resolved' : 'Show Resolved'}
        </button>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">No alerts</div>
          <p className="text-xs text-gray-600 mt-2">You're all set!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${
                alert.severity === 'critical'
                  ? 'bg-red-900/10 border-red-800'
                  : alert.severity === 'warning'
                  ? 'bg-yellow-900/10 border-yellow-800'
                  : 'bg-blue-900/10 border-blue-800'
              } ${alert.resolved ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white">{alert.title}</h3>
                    <span className="text-xs text-gray-500 capitalize">{alert.type.replace('_', ' ')}</span>
                    {alert.resolved && (
                      <span className="text-xs text-green-400">✓ Resolved</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 mb-2">{alert.message}</p>
                  <div className="text-xs text-gray-500">
                    {new Date(alert.createdAt).toLocaleString()}
                    {alert.resolvedAt && (
                      <span className="ml-2">• Resolved {new Date(alert.resolvedAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                {!alert.resolved && (
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="ml-4 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
