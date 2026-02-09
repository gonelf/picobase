'use client'

import { useState, useEffect } from 'react'

interface Collection {
  id: string
  name: string
  type: string
  system: boolean
  schema?: Array<{
    name: string
    type: string
    required: boolean
  }>
}

type Method = 'getList' | 'getOne' | 'create' | 'update' | 'delete'

interface QueryParams {
  page: string
  perPage: string
  filter: string
  sort: string
  expand: string
  recordId: string
  recordData: string
}

export default function ApiPlayground({ instanceId }: { instanceId: string }) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [selectedMethod, setSelectedMethod] = useState<Method>('getList')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [responseTime, setResponseTime] = useState<number>(0)
  const [loadingCollections, setLoadingCollections] = useState(true)

  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: '1',
    perPage: '20',
    filter: '',
    sort: '',
    expand: '',
    recordId: '',
    recordData: '{}',
  })

  useEffect(() => {
    fetchCollections()
  }, [instanceId])

  async function fetchCollections() {
    setLoadingCollections(true)
    try {
      const response = await fetch(`/api/instances/${instanceId}/collections`)
      if (!response.ok) throw new Error('Failed to fetch collections')
      const data = await response.json()
      setCollections(data)
      if (data.length > 0 && !selectedCollection) {
        setSelectedCollection(data[0].name)
      }
    } catch (err) {
      console.error('Error fetching collections:', err)
      setError(err instanceof Error ? err.message : 'Failed to load collections')
    } finally {
      setLoadingCollections(false)
    }
  }

  async function executeQuery() {
    if (!selectedCollection) {
      setError('Please select a collection')
      return
    }

    setLoading(true)
    setError(null)
    setResponse(null)
    const startTime = performance.now()

    try {
      let url = ''
      let method = 'GET'
      let body: any = null

      switch (selectedMethod) {
        case 'getList':
          const params = new URLSearchParams()
          if (queryParams.page) params.append('page', queryParams.page)
          if (queryParams.perPage) params.append('perPage', queryParams.perPage)
          if (queryParams.filter) params.append('filter', queryParams.filter)
          if (queryParams.sort) params.append('sort', queryParams.sort)
          if (queryParams.expand) params.append('expand', queryParams.expand)

          url = `/api/instances/${instanceId}/collections/${selectedCollection}/records?${params.toString()}`
          method = 'GET'
          break

        case 'getOne':
          if (!queryParams.recordId) {
            throw new Error('Record ID is required for getOne')
          }
          const getOneParams = new URLSearchParams()
          if (queryParams.expand) getOneParams.append('expand', queryParams.expand)

          url = `/api/instances/${instanceId}/collections/${selectedCollection}/records/${queryParams.recordId}${getOneParams.toString() ? '?' + getOneParams.toString() : ''}`
          method = 'GET'
          break

        case 'create':
          url = `/api/instances/${instanceId}/collections/${selectedCollection}/records`
          method = 'POST'
          try {
            body = JSON.parse(queryParams.recordData)
          } catch (e) {
            throw new Error('Invalid JSON in record data')
          }
          break

        case 'update':
          if (!queryParams.recordId) {
            throw new Error('Record ID is required for update')
          }
          url = `/api/instances/${instanceId}/collections/${selectedCollection}/records/${queryParams.recordId}`
          method = 'PATCH'
          try {
            body = JSON.parse(queryParams.recordData)
          } catch (e) {
            throw new Error('Invalid JSON in record data')
          }
          break

        case 'delete':
          if (!queryParams.recordId) {
            throw new Error('Record ID is required for delete')
          }
          url = `/api/instances/${instanceId}/collections/${selectedCollection}/records/${queryParams.recordId}`
          method = 'DELETE'
          break
      }

      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (body) {
        fetchOptions.body = JSON.stringify(body)
      }

      const res = await fetch(url, fetchOptions)
      const endTime = performance.now()
      setResponseTime(Math.round(endTime - startTime))

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(errorData.details || errorData.error || 'Request failed')
      }

      if (res.status === 204) {
        setResponse({ success: true, message: 'Record deleted successfully' })
      } else {
        const data = await res.json()
        setResponse(data)
      }
    } catch (err) {
      console.error('Error executing query:', err)
      setError(err instanceof Error ? err.message : 'Query execution failed')
    } finally {
      setLoading(false)
    }
  }

  function generateCodeSnippet(): string {
    if (!selectedCollection) return ''

    const collectionName = selectedCollection
    let code = ''

    switch (selectedMethod) {
      case 'getList':
        const options: string[] = []
        if (queryParams.filter) options.push(`  filter: '${queryParams.filter}'`)
        if (queryParams.sort) options.push(`  sort: '${queryParams.sort}'`)
        if (queryParams.expand) options.push(`  expand: '${queryParams.expand}'`)

        code = `const result = await pb.collection('${collectionName}').getList(${queryParams.page || '1'}, ${queryParams.perPage || '20'}${options.length > 0 ? ',\n  {\n' + options.join(',\n') + '\n  }' : ''})`
        break

      case 'getOne':
        code = `const record = await pb.collection('${collectionName}').getOne('${queryParams.recordId}'${queryParams.expand ? `, {\n  expand: '${queryParams.expand}'\n}` : ''})`
        break

      case 'create':
        const createData = queryParams.recordData || '{}'
        code = `const record = await pb.collection('${collectionName}').create(${createData})`
        break

      case 'update':
        const updateData = queryParams.recordData || '{}'
        code = `const record = await pb.collection('${collectionName}').update('${queryParams.recordId}', ${updateData})`
        break

      case 'delete':
        code = `await pb.collection('${collectionName}').delete('${queryParams.recordId}')`
        break
    }

    return code
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  if (loadingCollections) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-gray-500">Loading collections...</div>
      </div>
    )
  }

  if (collections.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-sm text-gray-400 mb-2">No collections yet</p>
          <p className="text-xs text-gray-500">Create a collection in the Table Editor to start testing API calls.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6 gap-4">
      {/* Query Builder */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
        {/* Collection and Method Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Collection</label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {collections.map((collection) => (
                <option key={collection.id} value={collection.name}>
                  {collection.name} {collection.system ? '(system)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Method</label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value as Method)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="getList">getList</option>
              <option value="getOne">getOne</option>
              <option value="create">create</option>
              <option value="update">update</option>
              <option value="delete">delete</option>
            </select>
          </div>
        </div>

        {/* Dynamic Form Fields */}
        {selectedMethod === 'getList' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Page</label>
              <input
                type="number"
                value={queryParams.page}
                onChange={(e) => setQueryParams({ ...queryParams, page: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Per Page</label>
              <input
                type="number"
                value={queryParams.perPage}
                onChange={(e) => setQueryParams({ ...queryParams, perPage: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="1"
                max="200"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Filter
                <span className="text-gray-600 ml-1">(e.g., published = true)</span>
              </label>
              <input
                type="text"
                value={queryParams.filter}
                onChange={(e) => setQueryParams({ ...queryParams, filter: e.target.value })}
                placeholder="status = 'active' && created > '2024-01-01'"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Sort
                <span className="text-gray-600 ml-1">(e.g., -created)</span>
              </label>
              <input
                type="text"
                value={queryParams.sort}
                onChange={(e) => setQueryParams({ ...queryParams, sort: e.target.value })}
                placeholder="-created,title"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Expand
                <span className="text-gray-600 ml-1">(relations)</span>
              </label>
              <input
                type="text"
                value={queryParams.expand}
                onChange={(e) => setQueryParams({ ...queryParams, expand: e.target.value })}
                placeholder="author,category"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}

        {selectedMethod === 'getOne' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Record ID</label>
              <input
                type="text"
                value={queryParams.recordId}
                onChange={(e) => setQueryParams({ ...queryParams, recordId: e.target.value })}
                placeholder="abc123def456"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Expand
                <span className="text-gray-600 ml-1">(relations)</span>
              </label>
              <input
                type="text"
                value={queryParams.expand}
                onChange={(e) => setQueryParams({ ...queryParams, expand: e.target.value })}
                placeholder="author,category"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}

        {(selectedMethod === 'create' || selectedMethod === 'update') && (
          <div className="space-y-4">
            {selectedMethod === 'update' && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Record ID</label>
                <input
                  type="text"
                  value={queryParams.recordId}
                  onChange={(e) => setQueryParams({ ...queryParams, recordId: e.target.value })}
                  placeholder="abc123def456"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Record Data (JSON)
              </label>
              <textarea
                value={queryParams.recordData}
                onChange={(e) => setQueryParams({ ...queryParams, recordData: e.target.value })}
                placeholder='{\n  "title": "My Post",\n  "content": "Hello world",\n  "published": true\n}'
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                rows={8}
              />
            </div>
          </div>
        )}

        {selectedMethod === 'delete' && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Record ID</label>
            <input
              type="text"
              value={queryParams.recordId}
              onChange={(e) => setQueryParams({ ...queryParams, recordId: e.target.value })}
              placeholder="abc123def456"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={executeQuery}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-md hover:bg-primary-500 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Executing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Run Query
            </>
          )}
        </button>
      </div>

      {/* Response Section */}
      {(response || error) && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Response
              {responseTime > 0 && (
                <span className="ml-2 text-green-500">({responseTime}ms)</span>
              )}
            </h3>
            {response && (
              <button
                onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Copy
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            {error ? (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded text-sm text-red-400">
                {error}
              </div>
            ) : (
              <pre className="text-xs text-gray-300 font-mono bg-gray-950 p-3 rounded overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Code Snippet */}
      {selectedCollection && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              SDK Code
            </h3>
            <button
              onClick={() => copyToClipboard(generateCodeSnippet())}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Copy
            </button>
          </div>

          <pre className="text-xs text-gray-300 font-mono bg-gray-950 p-3 rounded overflow-x-auto">
            {generateCodeSnippet()}
          </pre>
        </div>
      )}
    </div>
  )
}
