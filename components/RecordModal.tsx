'use client'

import { useState, useEffect } from 'react'

interface Field {
  name: string
  type: string
  required: boolean
  options?: any
}

interface Collection {
  id: string
  name: string
  schema?: Field[]
}

interface Record {
  id?: string
  [key: string]: any
}

export default function RecordModal({
  instanceId,
  collection,
  record,
  onClose,
  onSuccess,
}: {
  instanceId: string
  collection: Collection
  record?: Record
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = !!record
  const [formData, setFormData] = useState<Record>(record || {})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEdit
        ? `/api/instances/${instanceId}/collections/${collection.id}/records/${record?.id}`
        : `/api/instances/${instanceId}/collections/${collection.id}/records`

      const method = isEdit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        let errorMessage = `Failed to ${isEdit ? 'update' : 'create'} record`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
        } catch (e) {
          try {
            const errorText = await response.text()
            if (errorText) errorMessage = errorText
          } catch {
            errorMessage = `${errorMessage} (${response.status} ${response.statusText})`
          }
        }
        throw new Error(errorMessage)
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error saving record:', err)
      setError(err instanceof Error ? err.message : 'Failed to save record')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-white">
                {isEdit ? 'Edit Record' : 'Create Record'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {collection.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {collection.schema?.map((field) => (
            <div key={field.name}>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {field.name}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <FieldInput
                field={field}
                value={formData[field.name]}
                onChange={(value) => handleChange(field.name, value)}
              />
            </div>
          ))}

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-md hover:bg-gray-800 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field
  value: any
  onChange: (value: any) => void
}) {
  const commonClasses = "w-full px-3 py-2 text-sm border border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"

  switch (field.type) {
    case 'bool':
      return (
        <input
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 bg-gray-800 border-gray-700"
        />
      )

    case 'number':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          required={field.required}
          className={commonClasses}
        />
      )

    case 'date':
      return (
        <input
          type="datetime-local"
          value={value ? new Date(value).toISOString().slice(0, 16) : ''}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
          required={field.required}
          className={commonClasses}
        />
      )

    case 'select':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={commonClasses}
        >
          <option value="">Select...</option>
          {field.options?.values?.map((option: string) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )

    case 'json':
      return (
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value))
            } catch {
              onChange(e.target.value)
            }
          }}
          required={field.required}
          rows={4}
          className={commonClasses}
          placeholder='{"key": "value"}'
        />
      )

    case 'editor':
    case 'text':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          rows={4}
          className={commonClasses}
        />
      )

    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={commonClasses}
        />
      )
  }
}
