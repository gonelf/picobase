'use client'

import React from 'react'
import { SuperTokensWrapper } from 'supertokens-auth-react'
import SuperTokensReact from 'supertokens-auth-react'
import { frontendConfig } from '@/config/frontend'

if (typeof window !== 'undefined') {
    SuperTokensReact.init(frontendConfig())
}

export const SuperTokensProvider = ({ children }: { children: React.ReactNode }) => {
    return <SuperTokensWrapper>{children}</SuperTokensWrapper>
}
