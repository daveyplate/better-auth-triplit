import type { Models, TriplitClient } from "@triplit/client"
import { useEffect } from "react"
import { initTriplitAuth, type TriplitAuthOptions } from "./init-triplit-auth"

export function useTriplitAuth<M extends Models<M>>(
    triplit: TriplitClient<M>,
    options?: TriplitAuthOptions
) {
    useEffect(() => initTriplitAuth(triplit, options), [triplit, options])
}
