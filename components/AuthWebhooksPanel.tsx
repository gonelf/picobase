'use client'

import { useState, useEffect } from 'react'

interface Webhook {
  id: string
  url: string
  events: WebhookEvent[]
  enabled: boolean
  secret: string
}

type WebhookEvent = 'onSignUp' | 'onSignIn' | 'onPasswordReset' | 'onEmailVerified' | 'onEmailChange'

const AVAILABLE_EVENTS: { key: WebhookEvent; label: string; description: string }[] = [
  { key: 'onSignUp', label: 'User Sign Up', description: 'Triggered when a new user registers' },
  { key: 'onSignIn', label: 'User Sign In', description: 'Triggered when a user logs in' },
  { key: 'onPasswordReset', label: 'Password Reset', description: 'Triggered when a user resets their password' },
  { key: 'onEmailVerified', label: 'Email Verified', description: 'Triggered when a user verifies their email' },
  { key: 'onEmailChange', label: 'Email Change', description: 'Triggered when a user changes their email' },
]

interface Props {
  instanceId: string
}

function generateId(): string {
  return 'wh_' + Math.random().toString(36).substring(2, 15)
}

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'whsec_'
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function AuthWebhooksPanel({ instanceId }: Props) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchWebhooks()
  }, [instanceId])

  async function fetchWebhooks() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/instances/${instanceId}/webhooks`)

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.details || data.error || 'Failed to fetch webhooks')
      }

      const data = await response.json()
      setWebhooks(data.webhooks || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load webhooks')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/instances/${instanceId}/webhooks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhooks }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.details || data.error || 'Failed to save webhooks')
      }

      setSuccess(true)
      setEditingId(null)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save webhooks')
    } finally {
      setSaving(false)
    }
  }

  async function handleTest(webhook: Webhook) {
    setTestingId(webhook.id)
    setTestResult(null)

    try {
      const response = await fetch(`/api/instances/${instanceId}/webhooks/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhook.url, secret: webhook.secret }),
      })

      const data = await response.json()

      setTestResult({
        id: webhook.id,
        ok: response.ok,
        message: data.message || (response.ok ? 'Webhook endpoint responded successfully' : 'Test failed'),
      })
    } catch (err) {
      setTestResult({
        id: webhook.id,
        ok: false,
        message: err instanceof Error ? err.message : 'Test request failed',
      })
    } finally {
      setTestingId(null)
    }
  }

  function addWebhook() {
    const newWebhook: Webhook = {
      id: generateId(),
      url: '',
      events: ['onSignUp'],
      enabled: true,
      secret: generateSecret(),
    }
    setWebhooks(prev => [...prev, newWebhook])
    setEditingId(newWebhook.id)
  }

  function removeWebhook(id: string) {
    setWebhooks(prev => prev.filter(w => w.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function updateWebhook(id: string, updates: Partial<Webhook>) {
    setWebhooks(prev => prev.map(w => (w.id === id ? { ...w, ...updates } : w)))
  }

  function toggleEvent(webhookId: string, event: WebhookEvent) {
    setWebhooks(prev =>
      prev.map(w => {
        if (w.id !== webhookId) return w
        const events = w.events.includes(event)
          ? w.events.filter(e => e !== event)
          : [...w.events, event]
        return { ...w, events }
      })
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-gray-500">Loading webhooks...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
          <p className="text-sm text-green-400">Webhooks saved successfully.</p>
        </div>
      )}

      {/* Info box */}
      <div className="border border-gray-800 rounded-lg bg-gray-900 p-5">
        <h3 className="text-sm font-medium text-white mb-1">Auth Webhooks</h3>
        <p className="text-xs text-gray-500">
          Configure webhook URLs to receive notifications when auth events occur.
          Each webhook receives a POST request with a JSON payload containing the event type and user data.
          Requests include an <code className="px-1 bg-gray-800 rounded">X-Webhook-Signature</code> header
          signed with your secret for verification.
        </p>
      </div>

      {/* Webhook list */}
      {webhooks.length > 0 && (
        <div className="border border-gray-800 rounded-lg bg-gray-900 overflow-hidden divide-y divide-gray-800">
          {webhooks.map(webhook => (
            <div key={webhook.id} className="px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={webhook.enabled}
                    onClick={() => updateWebhook(webhook.id, { enabled: !webhook.enabled })}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                      webhook.enabled ? 'bg-primary-600' : 'bg-gray-700'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      webhook.enabled ? 'translate-x-[18px]' : 'translate-x-1'
                    }`} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white truncate font-mono">
                      {webhook.url || '(no URL set)'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {webhook.events.length} event{webhook.events.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    onClick={() => setEditingId(editingId === webhook.id ? null : webhook.id)}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {editingId === webhook.id ? 'Close' : 'Edit'}
                  </button>
                  <button
                    onClick={() => removeWebhook(webhook.id)}
                    className="text-xs text-red-500 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {editingId === webhook.id && (
                <div className="mt-3 pt-3 border-t border-gray-800 space-y-4">
                  {/* URL */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Endpoint URL</label>
                    <input
                      type="url"
                      value={webhook.url}
                      onChange={e => updateWebhook(webhook.id, { url: e.target.value })}
                      placeholder="https://api.example.com/webhooks/picobase"
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Secret */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Signing Secret</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={webhook.secret}
                        readOnly
                        className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-400 font-mono"
                      />
                      <button
                        onClick={() => updateWebhook(webhook.id, { secret: generateSecret() })}
                        className="px-3 py-1.5 border border-gray-700 text-gray-300 rounded-md hover:bg-gray-800 text-xs transition-colors"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>

                  {/* Events */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Events</label>
                    <div className="space-y-2">
                      {AVAILABLE_EVENTS.map(event => (
                        <label key={event.key} className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={webhook.events.includes(event.key)}
                            onChange={() => toggleEvent(webhook.id, event.key)}
                            className="mt-0.5 rounded border-gray-700 bg-gray-800 text-primary-600 focus:ring-primary-500"
                          />
                          <div>
                            <div className="text-sm text-white">{event.label}</div>
                            <div className="text-xs text-gray-500">{event.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Test button */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTest(webhook)}
                      disabled={!webhook.url || testingId === webhook.id}
                      className="px-3 py-1.5 border border-gray-700 text-gray-300 rounded-md hover:bg-gray-800 text-xs transition-colors disabled:opacity-50"
                    >
                      {testingId === webhook.id ? 'Testing...' : 'Send Test Event'}
                    </button>
                    {testResult && testResult.id === webhook.id && (
                      <span className={`text-xs ${testResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                        {testResult.message}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {webhooks.length === 0 && (
        <div className="text-center p-8 border border-dashed border-gray-800 rounded-lg">
          <p className="text-sm text-gray-500 mb-3">No webhooks configured yet.</p>
          <p className="text-xs text-gray-600 mb-4">
            Add a webhook to receive real-time notifications about auth events.
          </p>
        </div>
      )}

      {/* Add webhook + Save */}
      <div className="flex items-center justify-between">
        <button
          onClick={addWebhook}
          className="px-3 py-1.5 border border-gray-700 text-gray-300 rounded-md hover:bg-gray-800 text-xs transition-colors"
        >
          + Add Webhook
        </button>

        {webhooks.length > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {saving ? 'Saving...' : 'Save Webhooks'}
          </button>
        )}
      </div>

      {/* Payload format reference */}
      {webhooks.length > 0 && (
        <div className="border border-gray-800 rounded-lg bg-gray-900 p-5">
          <h4 className="text-xs font-medium text-gray-400 mb-2">Example Webhook Payload</h4>
          <pre className="text-xs text-gray-500 bg-gray-800 rounded-md p-3 overflow-x-auto font-mono">
{`{
  "event": "onSignUp",
  "timestamp": "2026-02-08T12:00:00Z",
  "instance_id": "${instanceId}",
  "data": {
    "id": "user_abc123",
    "email": "user@example.com",
    "created": "2026-02-08T12:00:00Z"
  }
}`}
          </pre>
        </div>
      )}
    </div>
  )
}
