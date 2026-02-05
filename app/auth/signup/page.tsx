import { redirect } from 'next/navigation'
import { workos, clientId, getCallbackUrl } from '@/lib/workos'

export default async function SignUp() {
  // Get the authorization URL from WorkOS with screenHint for signup
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: 'authkit',
    clientId,
    redirectUri: getCallbackUrl(),
    screenHint: 'sign-up',
  })

  // Redirect to WorkOS AuthKit
  redirect(authorizationUrl)
}
