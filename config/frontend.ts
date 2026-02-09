import EmailPasswordReact from 'supertokens-auth-react/recipe/emailpassword'
import SessionReact from 'supertokens-auth-react/recipe/session'
import PasswordlessReact from 'supertokens-auth-react/recipe/passwordless'
import { appInfo } from './appInfo'
import { SuperTokensConfig } from 'supertokens-auth-react/lib/build/types'

export const frontendConfig = (): SuperTokensConfig => {
    return {
        appInfo,
        recipeList: [
            EmailPasswordReact.init(),
            PasswordlessReact.init({
                contactMethod: "EMAIL",
            }),
            SessionReact.init(),
        ],
    }
}
