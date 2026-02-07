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
          if (errorData.details) {
            errorMessage = errorData.details
          } else {
            errorMessage = errorData.error || errorMessage
          }
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
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-gray-500">Loading users...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchUsers}
          className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center p-12 text-gray-500">
        <p className="text-sm">No users found. Users will appear here once they sign up.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-500">
        Total users: {totalUsers}
      </div>

      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 border-b border-gray-800">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-900/50 transition-colors">
                <td className="px-4 py-2.5 text-sm text-white">{user.email}</td>
                <td className="px-4 py-2.5 text-sm text-gray-400">{user.username || '-'}</td>
                <td className="px-4 py-2.5">
                  {user.verified ? (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-900/30 text-green-400 rounded">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-yellow-900/30 text-yellow-400 rounded">
                      Unverified
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">
                  {new Date(user.created).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600 font-mono">{user.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalUsers > 50 && (
        <p className="text-xs text-gray-600 text-center pt-2">
          Showing first 50 users. Use the PocketBase admin for full user management.
        </p>
      )}
    </div>
  )
}
