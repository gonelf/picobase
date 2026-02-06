import SignOutButton from '../components/SignOutButton'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getAuthUrl } from '@/lib/auth-utils'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect(getAuthUrl('signin'))
  }

  const displayName = session.user.firstName && session.user.lastName
    ? `${session.user.firstName} ${session.user.lastName}`
    : session.user.email

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-primary-600">
                PicoBase
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Instances
              </Link>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {displayName}
                </span>
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
