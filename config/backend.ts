import SuperTokens from 'supertokens-node'
import SessionNode from 'supertokens-node/recipe/session'
import EmailPasswordNode from 'supertokens-node/recipe/emailpassword'
import PasswordlessNode from 'supertokens-node/recipe/passwordless'
import { appInfo } from './appInfo'
import { TypeInput } from 'supertokens-node/types'

export const backendConfig = (): TypeInput => {
    return {
        framework: 'custom',
        supertokens: {
            connectionURI: process.env.SUPERTOKENS_CONNECTION_URI || 'https://try.supertokens.com',
            apiKey: process.env.SUPERTOKENS_API_KEY,
        },
        appInfo,
        recipeList: [
            EmailPasswordNode.init(),
            PasswordlessNode.init({
                flowType: "USER_INPUT_CODE",
                contactMethod: "EMAIL",
            }),
            SessionNode.init(),
        ],
        isInServerlessEnv: true,
    }
}
