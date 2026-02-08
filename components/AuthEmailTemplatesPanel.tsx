'use client'

import { useState, useEffect } from 'react'

interface EmailTemplate {
  subject: string
  body: string
}

interface EmailTemplates {
  verificationTemplate: EmailTemplate
  resetPasswordTemplate: EmailTemplate
  confirmEmailChangeTemplate: EmailTemplate
}

interface SmtpConfig {
  enabled: boolean
  host: string
  port: number
  username: string
  password: string
  tls: boolean
}

interface Props {
  instanceId: string
}

const DEFAULT_TEMPLATES: EmailTemplates = {
  verificationTemplate: {
    subject: 'Verify your email',
    body: `<p>Hello,</p>
<p>Thank you for signing up. Please verify your email by clicking the link below:</p>
<p><a href="{ACTION_URL}">Verify Email</a></p>
<p>If you did not request this, please ignore this email.</p>`,
  },
  resetPasswordTemplate: {
    subject: 'Reset your password',
    body: `<p>Hello,</p>
<p>Click on the link below to reset your password:</p>
<p><a href="{ACTION_URL}">Reset Password</a></p>
<p>If you did not request a password reset, please ignore this email.</p>`,
  },
  confirmEmailChangeTemplate: {
    subject: 'Confirm your email change',
    body: `<p>Hello,</p>
<p>Click on the link below to confirm your new email address:</p>
<p><a href="{ACTION_URL}">Confirm Email Change</a></p>
<p>If you did not request this change, please ignore this email.</p>`,
  },
}

const DEFAULT_SMTP: SmtpConfig = {
  enabled: false,
  host: '',
  port: 587,
  username: '',
  password: '',
  tls: true,
}

const TEMPLATE_TABS = [
  { key: 'verificationTemplate', label: 'Verification' },
  { key: 'resetPasswordTemplate', label: 'Password Reset' },
  { key: 'confirmEmailChangeTemplate', label: 'Email Change' },
] as const

type TemplateKey = (typeof TEMPLATE_TABS)[number]['key']

const TEMPLATE_VARIABLES = [
  { name: '{ACTION_URL}', description: 'The verification/reset/confirm URL' },
  { name: '{APP_NAME}', description: 'Your application name' },
  { name: '{APP_URL}', description: 'Your application URL' },
]

export default function AuthEmailTemplatesPanel({ instanceId }: Props) {
  const [templates, setTemplates] = useState<EmailTemplates>(DEFAULT_TEMPLATES)
  const [smtp, setSmtp] = useState<SmtpConfig>(DEFAULT_SMTP)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey>('verificationTemplate')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [instanceId])

  async function fetchTemplates() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/instances/${instanceId}/auth-settings`)

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.details || data.error || 'Failed to fetch email templates')
      }

      const data = await response.json()

      if (data.settings) {
        const s = data.settings

        // PocketBase stores email templates in meta.* settings
        if (s.meta) {
          setTemplates({
            verificationTemplate: {
              subject: s.meta.verificationTemplate?.subject || DEFAULT_TEMPLATES.verificationTemplate.subject,
              body: s.meta.verificationTemplate?.body || DEFAULT_TEMPLATES.verificationTemplate.body,
            },
            resetPasswordTemplate: {
              subject: s.meta.resetPasswordTemplate?.subject || DEFAULT_TEMPLATES.resetPasswordTemplate.subject,
              body: s.meta.resetPasswordTemplate?.body || DEFAULT_TEMPLATES.resetPasswordTemplate.body,
            },
            confirmEmailChangeTemplate: {
              subject: s.meta.confirmEmailChangeTemplate?.subject || DEFAULT_TEMPLATES.confirmEmailChangeTemplate.subject,
              body: s.meta.confirmEmailChangeTemplate?.body || DEFAULT_TEMPLATES.confirmEmailChangeTemplate.body,
            },
          })
        }

        // SMTP settings
        if (s.smtp) {
          setSmtp({
            enabled: s.smtp.enabled ?? DEFAULT_SMTP.enabled,
            host: s.smtp.host || DEFAULT_SMTP.host,
            port: s.smtp.port || DEFAULT_SMTP.port,
            username: s.smtp.username || DEFAULT_SMTP.username,
            password: s.smtp.password || DEFAULT_SMTP.password,
            tls: s.smtp.tls ?? DEFAULT_SMTP.tls,
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email templates')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/instances/${instanceId}/auth-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            meta: {
              verificationTemplate: templates.verificationTemplate,
              resetPasswordTemplate: templates.resetPasswordTemplate,
              confirmEmailChangeTemplate: templates.confirmEmailChangeTemplate,
            },
            smtp: smtp,
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.details || data.error || 'Failed to save email templates')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save email templates')
    } finally {
      setSaving(false)
    }
  }

  function updateTemplate(key: TemplateKey, field: 'subject' | 'body', value: string) {
    setTemplates(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  function resetTemplate(key: TemplateKey) {
    setTemplates(prev => ({
      ...prev,
      [key]: DEFAULT_TEMPLATES[key],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-gray-500">Loading email templates...</div>
      </div>
    )
  }

  const current = templates[activeTemplate]

  return (
    <div className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
          <p className="text-sm text-green-400">Email templates saved successfully.</p>
        </div>
      )}

      {/* SMTP Configuration */}
      <div className="border border-gray-800 rounded-lg bg-gray-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-white">SMTP Configuration</h3>
            <p className="text-xs text-gray-500 mt-0.5">Configure a custom mail server for sending auth emails</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={smtp.enabled}
            onClick={() => setSmtp(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              smtp.enabled ? 'bg-primary-600' : 'bg-gray-700'
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              smtp.enabled ? 'translate-x-[18px]' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {smtp.enabled && (
          <div className="space-y-3 pt-3 border-t border-gray-800">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Host</label>
                <input
                  type="text"
                  value={smtp.host}
                  onChange={e => setSmtp(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="smtp.example.com"
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Port</label>
                <input
                  type="number"
                  value={smtp.port}
                  onChange={e => setSmtp(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Username</label>
              <input
                type="text"
                value={smtp.username}
                onChange={e => setSmtp(prev => ({ ...prev, username: e.target.value }))}
                placeholder="user@example.com"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={smtp.password}
                onChange={e => setSmtp(prev => ({ ...prev, password: e.target.value }))}
                placeholder="SMTP password or app-specific password"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={smtp.tls}
                onChange={e => setSmtp(prev => ({ ...prev, tls: e.target.checked }))}
                className="rounded border-gray-700 bg-gray-800 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-300">Use TLS</span>
            </label>
          </div>
        )}
      </div>

      {/* Template Editor */}
      <div className="border border-gray-800 rounded-lg bg-gray-900 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-sm font-medium text-white">Email Templates</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Customize the emails sent during authentication flows
          </p>
        </div>

        {/* Template selector tabs */}
        <div className="border-b border-gray-800 px-5">
          <nav className="flex gap-0 -mb-px">
            {TEMPLATE_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTemplate(tab.key)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTemplate === tab.key
                    ? 'border-primary-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-5 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Subject</label>
            <input
              type="text"
              value={current.subject}
              onChange={e => updateTemplate(activeTemplate, 'subject', e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Body editor / preview toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400">Body (HTML)</label>
              <div className="flex gap-1">
                <button
                  onClick={() => resetTemplate(activeTemplate)}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Reset to default
                </button>
                <span className="text-gray-700 mx-1">|</span>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPreview ? 'Edit' : 'Preview'}
                </button>
              </div>
            </div>

            {showPreview ? (
              <div
                className="w-full min-h-[200px] rounded-md border border-gray-700 bg-white p-4 text-sm text-gray-900"
                dangerouslySetInnerHTML={{ __html: current.body }}
              />
            ) : (
              <textarea
                value={current.body}
                onChange={e => updateTemplate(activeTemplate, 'body', e.target.value)}
                rows={10}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none font-mono resize-y"
              />
            )}
          </div>

          {/* Template variables reference */}
          <div className="rounded-md bg-gray-800/50 p-3">
            <div className="text-xs text-gray-400 mb-2">Available variables:</div>
            <div className="space-y-1">
              {TEMPLATE_VARIABLES.map(v => (
                <div key={v.name} className="flex items-center gap-2 text-xs">
                  <code className="px-1.5 py-0.5 bg-gray-800 text-primary-400 rounded font-mono">{v.name}</code>
                  <span className="text-gray-500">{v.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save Templates'}
        </button>
      </div>
    </div>
  )
}
