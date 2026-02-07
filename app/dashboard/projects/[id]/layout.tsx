import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getInstanceStatus } from '@/lib/pocketbase'
import { getAuthUrl } from '@/lib/auth-utils'
import ProjectSidebar from '@/components/ProjectSidebar'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect(getAuthUrl('signin'))
  }

  const { id } = await params
  const instance = await getInstanceStatus(id)

  if (!instance) {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-[calc(100vh-49px)]">
      <ProjectSidebar
        projectId={id}
        projectName={instance.name as string}
        projectStatus={instance.status as string}
      />
      <div className="flex-1 overflow-auto bg-gray-950">
        {children}
      </div>
    </div>
  )
}
