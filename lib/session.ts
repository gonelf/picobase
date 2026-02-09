import { getSSRSession } from "supertokens-node/nextjs";
import { cookies } from "next/headers";
import SuperTokens, { getUser } from "supertokens-node";
import { backendConfig } from "@/config/backend";
import { syncUser } from "./auth";
import { createModuleLogger } from './logger'

const log = createModuleLogger('Session')

import { getServerSession } from "next-auth";
import { authOptions } from "./nextauth";

// Ensure init
try {
    SuperTokens.init(backendConfig());
} catch (e) {
    // ignore if already initialized
}

export async function getSession() {
    const provider = process.env.AUTH_PROVIDER || 'supertokens';

    if (provider === 'nextauth') {
        return getServerSession(authOptions);
    }

    return getSupertokensSession();
}

export async function getSupertokensSession() {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const { accessTokenPayload, hasToken } = await getSSRSession(allCookies);

    if (!hasToken || !accessTokenPayload) {
        return null;
    }

    const userId = accessTokenPayload.sub;
    if (!userId) return null;

    try {
        const user = await getUser(userId);
        if (!user) return null;

        const email = user.emails ? user.emails[0] : "";

        // Sync user to local DB to satisfy foreign key constraints
        await syncUser(user.id, email);

        return {
            user: {
                id: user.id,
                email: email,
                firstName: '',
                lastName: '',
            },
        };
    } catch (error) {
        log.error({ err: error, userId }, 'Error fetching user');
        return null;
    }
}
