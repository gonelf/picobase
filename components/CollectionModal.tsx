'use client'

import { useState } from 'react'

interface SchemaField {
  name: string
  type: string
  required: boolean
  options?: Record<string, any>
}

interface Collection {
  id?: string
  name: string
  type: string
  schema: SchemaField[]
  system?: boolean
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'editor', label: 'Editor' },
  { value: 'number', label: 'Number' },
  { value: 'bool', label: 'Boolean' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'json', label: 'JSON' },
  { value: 'file', label: 'File' },
  { value: 'relation', label: 'Relation' },
]

export default function CollectionModal({
  instanceId,
  collection,
  onClose,
  onSuccess,
}: {
  instanceId: string
  collection?: Collection
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = !!collection?.id
  const [name, setName] = useState(collection?.name || '')
  const [type, setType] = useState(collection?.type || 'base')
  const [schema, setSchema] = useState<SchemaField[]>(collection?.schema || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addField() {
    setSchema([...schema, { name: '', type: 'text', required: false }])
  }

  function removeField(index: number) {
    setSchema(schema.filter((_, i) => i !== index))
  }

  function updateField(index: number, updates: Partial<SchemaField>) {
    setSchema(schema.map((field, i) => i === index ? { ...field, ...updates } : field))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const emptyFields = schema.filter(f => !f.name.trim())
    if (emptyFields.length > 0) {
      setError('All fields must have a name')
      setLoading(false)
      return
    }

    const duplicateNames = schema.filter((f, i) =>
      schema.findIndex(s => s.name === f.name) !== i
    )
    if (duplicateNames.length > 0) {
      setError(`Duplicate field name: ${duplicateNames[0].name}`)
      setLoading(false)
      return
    }

    try {
      const url = isEdit
        ? `/api/instances/${instanceId}/collections/${collection!.id}`
        : `/api/instances/${instanceId}/collections`

      const method = isEdit ? 'PATCH' : 'POST'

      const body: Record<string, any> = { name, schema }
      if (!isEdit) {
        body.type = type
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        let errorMessage = `Failed to ${isEdit ? 'update' : 'create'} collection`
        try {
          const errorData = await response.json()
          errorMessage = errorData.details || errorData.error || errorMessage
        } catch {
          const errorText = await response.text()
          if (errorText) errorMessage = errorText
        }
        throw new Error(errorMessage)
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save collection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-white">
                {isEdit ? 'Edit Collection' : 'New Collection'}
              </h2>
              {isEdit && (
                <p className="text-xs text-gray-500 mt-0.5">{collection!.name}</p>
              )}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Collection Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. posts, products"
                className="w-full px-3 py-2 text-sm border border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isEdit}
                className="w-full px-3 py-2 text-sm border border-gray-700 rounded-md bg-gray-800 text-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
              >
                <option value="base">Base</option>
                <option value="auth">Auth</option>
                <option value="view">View</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-gray-400">Schema Fields</label>
              <button
                type="button"
                onClick={addField}
                className="px-2.5 py-1 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
              >
                + Add Field
              </button>
            </div>

            {schema.length === 0 ? (
              <div className="p-6 border border-dashed border-gray-700 rounded-lg text-center">
                <p className="text-sm text-gray-500">No fields defined yet</p>
                <button
                  type="button"
                  onClick={addField}
                  className="mt-2 text-sm text-primary-400 hover:text-primary-300"
                >
                  Add your first field
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {schema.map((field, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-gray-800/50 border border-gray-700 rounded-lg"
                  >
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => updateField(index, { name: e.target.value })}
                      placeholder="Field name"
                      className="flex-1 px-2.5 py-1.5 text-sm border border-gray-600 rounded bg-gray-800 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value })}
                      className="w-28 px-2.5 py-1.5 text-sm border border-gray-600 rounded bg-gray-800 text-white focus:border-primary-500 focus:outline-none"
                    >
                      {FIELD_TYPES.map(ft => (
                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                        className="w-3.5 h-3.5 text-primary-600 rounded focus:ring-primary-500 bg-gray-700 border-gray-600"
                      />
                      Required
                    </label>
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Collection' : 'Create Collection'}
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
