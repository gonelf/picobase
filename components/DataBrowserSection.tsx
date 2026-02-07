'use client'

import { useState, useCallback } from 'react'
import CollectionsList from './CollectionsList'
import DataBrowser from './DataBrowser'

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

export default function DataBrowserSection({ instanceId }: { instanceId: string }) {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCollectionUpdated = useCallback(() => {
    setSelectedCollection(null)
    setRefreshKey(k => k + 1)
  }, [])

  const handleCollectionDeleted = useCallback(() => {
    setSelectedCollection(null)
    setRefreshKey(k => k + 1)
  }, [])

  if (selectedCollection) {
    return (
      <DataBrowser
        instanceId={instanceId}
        collection={selectedCollection}
        onBack={() => setSelectedCollection(null)}
        onCollectionUpdated={handleCollectionUpdated}
        onCollectionDeleted={handleCollectionDeleted}
      />
    )
  }

  return (
    <CollectionsList
      key={refreshKey}
      instanceId={instanceId}
      onSelectCollection={setSelectedCollection}
    />
  )
}
