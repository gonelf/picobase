'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Collection {
  id: string
  name: string
  type: string
  schema?: Array<{
    name: string
    type: string
    required: boolean
  }>
}

type Method = 'getList' | 'getOne'

interface QueryParams {
  page: string
  perPage: string
  filter: string
  sort: string
  expand: string
  recordId: string
}

export default function PublicPlayground() {
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
    perPage: '10',
    filter: '',
    sort: '',
    expand: '',
    recordId: '',
  })

  useEffect(() => {
    fetchCollections()
  }, [])

  async function fetchCollections() {
    setLoadingCollections(true)
    try {
      const response = await fetch('/api/demo/collections')
      if (!response.ok) throw new Error('Failed to fetch demo collections')
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
      const params: any = {}

      switch (selectedMethod) {
        case 'getList':
          if (queryParams.page) params.page = queryParams.page
          if (queryParams.perPage) params.perPage = queryParams.perPage
          if (queryParams.filter) params.filter = queryParams.filter
          if (queryParams.sort) params.sort = queryParams.sort
          if (queryParams.expand) params.expand = queryParams.expand
          break

        case 'getOne':
          if (!queryParams.recordId) {
            throw new Error('Record ID is required for getOne')
          }
          params.recordId = queryParams.recordId
          if (queryParams.expand) params.expand = queryParams.expand
          break
      }

      const res = await fetch('/api/demo/playground', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: selectedMethod,
          collection: selectedCollection,
          params,
        }),
      })

      const endTime = performance.now()
      setResponseTime(Math.round(endTime - startTime))

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(errorData.error || 'Request failed')
      }

      const data = await res.json()
      setResponse(data.data)
      if (data.timing) {
        setResponseTime(data.timing)
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

        code = `const result = await pb.collection('${collectionName}').getList(${queryParams.page || '1'}, ${queryParams.perPage || '10'}${options.length > 0 ? ',\n  {\n' + options.join(',\n') + '\n  }' : ''})`
        break

      case 'getOne':
        code = `const record = await pb.collection('${collectionName}').getOne('${queryParams.recordId}'${queryParams.expand ? `, {\n  expand: '${queryParams.expand}'\n}` : ''})`
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
        <div className="text-sm text-gray-500">Loading demo collections...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Demo Warning Banner */}
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-500 mb-1">Demo Playground</h3>
            <p className="text-xs text-yellow-600/90 mb-2">
              This playground uses sample data. Only read operations (getList, getOne) are available.
              Rate limited to 30 requests per minute.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-1.5 text-xs text-yellow-500 hover:text-yellow-400 font-medium transition-colors"
            >
              Sign up to create your own instance with full API access
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

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
                  {collection.name}
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
                max="50"
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
                placeholder="status = 'active'"
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
                placeholder="-created"
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
                placeholder="author"
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
                placeholder="author"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
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
