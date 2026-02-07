'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface ProjectSidebarProps {
  projectId: string
  projectName: string
  projectStatus: string
}

const navItems = [
  {
    label: 'Table Editor',
    href: '/editor',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M3 6h18M3 18h18M8 6v12M16 6v12" />
      </svg>
    ),
  },
  {
    label: 'Authentication',
    href: '/auth',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: 'API Keys',
    href: '/api-keys',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function ProjectSidebar({ projectId, projectName, projectStatus }: ProjectSidebarProps) {
  const pathname = usePathname()
  const basePath = `/dashboard/projects/${projectId}`
  const [collapsed, setCollapsed] = useState(false)

  const isRunning = projectStatus === 'running'

  return (
    <div className={`${collapsed ? 'w-12' : 'w-56'} border-r border-gray-800 bg-gray-900 flex flex-col shrink-0 transition-all duration-200`}>
      {/* Header */}
      <div className={`border-b border-gray-800 ${collapsed ? 'px-2 py-3' : 'px-4 py-4'}`}>
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-8 h-8 rounded bg-primary-600/20 flex items-center justify-center text-primary-400 font-semibold text-xs hover:bg-primary-600/30 transition-colors"
            title={projectName}
          >
            {projectName.charAt(0).toUpperCase()}
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-primary-600/20 flex items-center justify-center text-primary-400 font-semibold text-xs">
              {projectName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-medium text-white truncate">{projectName}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-600'}`} />
                <span className="text-xs text-gray-500 capitalize">{projectStatus}</span>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="text-gray-600 hover:text-gray-400 transition-colors"
              title="Collapse sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-3 space-y-0.5 ${collapsed ? 'px-1.5' : 'px-2'}`}>
        {navItems.map((item) => {
          const fullHref = `${basePath}${item.href}`
          const isActive = pathname === fullHref || (item.href === '/editor' && pathname === basePath)

          return (
            <Link
              key={item.href}
              href={fullHref}
              title={collapsed ? item.label : undefined}
              className={`flex items-center ${collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2'} rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className={`shrink-0 ${isActive ? 'text-primary-400' : ''}`}>{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
