import { getSession } from '@/lib/session'
import { listUserInstances } from '@/lib/pocketbase'
import Link from 'next/link'
import ProjectCard from '@/components/ProjectCard'

export default async function Dashboard() {
  const session = await getSession()

  if (!session?.user?.id) {
    return null
  }

  const instances = await listUserInstances(session.user.id)

  const serializedProjects = instances.map((instance: any) => ({
    id: instance.id,
    name: instance.name,
    subdomain: instance.subdomain,
    status: instance.status,
    port: instance.port,
    created_at: instance.created_at,
    last_started_at: instance.last_started_at,
  }))

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-white">
          Your Projects
        </h1>
        <Link
          href="/dashboard/new"
          className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-md transition-colors"
        >
          New Project
        </Link>
      </div>

      {serializedProjects.length === 0 ? (
        <div className="text-center py-24 border border-gray-800 rounded-lg bg-gray-900/50">
          <div className="max-w-sm mx-auto">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gray-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              No projects yet
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Get started by creating your first project. It takes less than 60 seconds to deploy.
            </p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-md transition-colors"
            >
              New Project
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serializedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
