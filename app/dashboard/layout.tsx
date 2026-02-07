import SignOutButton from '../components/SignOutButton'
import { Logo } from '@/components/Logo'
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

  const user = session.user as any
  const displayName = user.name || (user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 sm:px-6">
          <div className="flex h-12 justify-between items-center">
            <div className="flex items-center gap-5">
              <Logo />
              <div className="h-5 w-px bg-gray-700" />
              <Link
                href="/dashboard"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                All Projects
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium text-xs">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-300 hidden sm:inline">
                  {displayName}
                </span>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
