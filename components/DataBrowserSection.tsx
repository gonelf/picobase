'use client'

import { useState } from 'react'
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

  if (selectedCollection) {
    return (
      <DataBrowser
        instanceId={instanceId}
        collection={selectedCollection}
        onBack={() => setSelectedCollection(null)}
      />
    )
  }

  return (
    <CollectionsList
      instanceId={instanceId}
      onSelectCollection={setSelectedCollection}
    />
  )
}
