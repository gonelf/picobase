'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  username?: string
  verified: boolean
  created: string
  updated: string
}

export default function AuthUsersPanel({ instanceId }: { instanceId: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    fetchUsers()
  }, [instanceId])

  async function fetchUsers() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/instances/${instanceId}/users?page=1&perPage=50`
      )

      if (!response.ok) {
        let errorMessage = 'Failed to fetch users'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
        } catch (e) {
          // If JSON parsing fails, try to get text
          try {
            const errorText = await response.text()
            if (errorText) errorMessage = errorText
          } catch {
            // If all else fails, use status text
            errorMessage = `${errorMessage} (${response.status} ${response.statusText})`
          }
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setUsers(data.items || [])
      setTotalUsers(data.totalItems || 0)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">Loading users...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        <button
          onClick={fetchUsers}
          className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        <p>No users found. Users will appear here once they sign up.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Total users: {totalUsers}
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {user.email}
                  </h4>
                  {user.verified ? (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded">
                      Verified
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded">
                      Unverified
                    </span>
                  )}
                </div>
                {user.username && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    @{user.username}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  ID: {user.id}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Created: {new Date(user.created).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalUsers > 50 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-4">
          Showing first 50 users. Use the PocketBase admin for full user management.
        </p>
      )}
    </div>
  )
}
