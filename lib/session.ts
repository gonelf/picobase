import { getSSRSession } from "supertokens-node/nextjs";
import { cookies } from "next/headers";
import SuperTokens, { getUser } from "supertokens-node";
import { backendConfig } from "@/config/backend";
import { syncUser } from "./auth";

// Ensure init
try {
    SuperTokens.init(backendConfig());
} catch (e) {
    // ignore if already initialized
}

export async function getSession() {
    return getSupertokensSession();
}

export async function getSupertokensSession() {
    const cookieStore = cookies();
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
        console.error("Error fetching user", error);
        return null;
    }
}
