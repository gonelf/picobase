import EmailPasswordReact from 'supertokens-auth-react/recipe/emailpassword'
import SessionReact from 'supertokens-auth-react/recipe/session'
import { appInfo } from './appInfo'
import { SuperTokensConfig } from 'supertokens-auth-react/lib/build/types'

export const frontendConfig = (): SuperTokensConfig => {
    return {
        appInfo,
        recipeList: [
            EmailPasswordReact.init(),
            SessionReact.init(),
        ],
    }
}
