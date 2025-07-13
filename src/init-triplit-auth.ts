import type { Models, SessionError, TriplitClient } from "@triplit/client"
import type { Session, User } from "better-auth"

type SessionData = {
    session: Session
    user: User
}

export type TriplitAuthOptions = {
    anonToken?: string
    sessionData?: SessionData | null
    isPending?: boolean
    onSessionError?: (error: SessionError) => void
}

export function initTriplitAuth<M extends Models<M>>(
    triplit: TriplitClient<M>,
    {
        anonToken,
        sessionData,
        isPending,
        onSessionError
    }: TriplitAuthOptions = {}
) {
    if (isPending) return

    const startSession = async (sessionData?: SessionData | null) => {
        const token =
            sessionData?.session.token ||
            anonToken ||
            process.env.NEXT_PUBLIC_TRIPLIT_ANON_TOKEN

        if (!token) return
        if (triplit.token === token) return

        // Update session token if it's the same user and role
        if (
            sessionData &&
            triplit.decodedToken?.sub === sessionData.user.id &&
            triplit.decodedToken?.role ===
                (sessionData.user as Record<string, unknown>).role
        ) {
            try {
                await triplit.updateSessionToken(token)
            } catch (error) {
                console.error(error)
            }

            return
        }

        // Clear local DB when we sign out
        if (!sessionData) {
            try {
                await triplit.clear()
            } catch (error) {
                console.error(error)
            }
        }

        try {
            triplit.disconnect()
            await triplit.startSession(token)
        } catch (error) {
            console.error(error)
        }
    }

    startSession(sessionData)

    const unbindOnSessionError = triplit.onSessionError((error) => {
        console.error(error)
        onSessionError?.(error)
    })

    return () => {
        unbindOnSessionError()
    }
}
