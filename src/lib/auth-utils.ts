import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
    try {
        const JWT_SECRET = new TextEncoder().encode(
            process.env.AUTH_SECRET || "art-share-jwt-secret-2026"
        );

        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token");

        if (!token?.value) {
            console.log("[Auth] No auth-token cookie found");
            return null;
        }

        console.log("[Auth] Token found, verifying...");
        const { payload } = await jwtVerify(token.value, JWT_SECRET);
        console.log("[Auth] Token verified for user:", payload.email);

        return {
            id: payload.id as string,
            name: payload.name as string,
            email: payload.email as string,
            role: payload.role as string,
        };
    } catch (error) {
        console.error("[Auth] Token verification failed:", error);
        return null;
    }
}
