'use client'

import { useState } from 'react'
import AuthUsersPanel from './AuthUsersPanel'
import AuthSettingsPanel from './AuthSettingsPanel'
import AuthProvidersPanel from './AuthProvidersPanel'

interface Props {
  instanceId: string
}

const TABS = [
  { key: 'users', label: 'Users' },
  { key: 'settings', label: 'Settings' },
  { key: 'providers', label: 'Providers' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function AuthDashboard({ instanceId }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('users')

  return (
    <div className="h-full flex flex-col">
      {/* Tab Bar */}
      <div className="border-b border-gray-800 px-6">
        <nav className="flex gap-0 -mb-px">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'users' && <AuthUsersPanel instanceId={instanceId} />}
        {activeTab === 'settings' && <AuthSettingsPanel instanceId={instanceId} />}
        {activeTab === 'providers' && <AuthProvidersPanel instanceId={instanceId} />}
      </div>
    </div>
  )
}
