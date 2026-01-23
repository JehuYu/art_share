import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
    process.env.AUTH_SECRET || "art-share-jwt-secret-2026"
);

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token");

        if (!token?.value) {
            return null;
        }

        const { payload } = await jwtVerify(token.value, JWT_SECRET);

        return {
            id: payload.id as string,
            name: payload.name as string,
            email: payload.email as string,
            role: payload.role as string,
        };
    } catch {
        return null;
    }
}
