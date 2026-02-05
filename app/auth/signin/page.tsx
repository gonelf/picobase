import { redirect } from 'next/navigation'
import { workos, clientId, getCallbackUrl } from '@/lib/workos'

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params.error

  // Get the authorization URL from WorkOS
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: 'authkit',
    clientId,
    redirectUri: getCallbackUrl(),
  })

  // Redirect to WorkOS AuthKit
  redirect(authorizationUrl)
}
