import type { HttpClient, Models, OrderStatement, WhereFilter } from "@triplit/client"
import type { Where } from "better-auth"
import { createAdapter } from "better-auth/adapters"
import { SignJWT } from "jose"

export interface TriplitAdapterConfig {
    /**
     * Helps you debug issues with the adapter.
     * @default false
     */
    debugLogs?: boolean
    /**
     * If the table names in the schema are plural.
     * @default true
     */
    usePlural?: boolean
    /**
     * The secret key to use for the JWT token.
     * @default process.env.BETTER_AUTH_SECRET
     */
    secretKey?: string
    // biome-ignore lint/suspicious/noExplicitAny:
    httpClient: HttpClient<any>
}

export function parseWhere(where?: Where[]) {
    const parsedWhere: WhereFilter<Models, string>[] = []

    where?.map((item) => {
        switch (item.operator) {
            case "eq":
                parsedWhere.push([item.field, "=", item.value])
                break
            case "in":
                parsedWhere.push([item.field, "in", item.value])
                break
            case "contains":
                parsedWhere.push([item.field, "like", `%${item.value}%`])
                break
            case "starts_with":
                parsedWhere.push([item.field, "like", `${item.value}%`])
                break
            case "ends_with":
                parsedWhere.push([item.field, "like", `%${item.value}`])
                break
            case "ne":
                parsedWhere.push([item.field, "!=", item.value])
                break
            case "gt":
                parsedWhere.push([item.field, ">", item.value])
                break
            case "gte":
                parsedWhere.push([item.field, ">=", item.value])
                break
            case "lt":
                parsedWhere.push([item.field, "<", item.value])
                break
            case "lte":
                parsedWhere.push([item.field, "<=", item.value])
                break
        }
    })

    return parsedWhere
}

export const triplitAdapter = ({
    usePlural = true,
    debugLogs = false,
    secretKey,
    httpClient
}: TriplitAdapterConfig) =>
    createAdapter({
        config: {
            adapterId: "triplit-adapter", // A unique identifier for the adapter.
            adapterName: "Triplit Adapter", // The name of the adapter.
            usePlural, // Whether the table names in the schema are plural.
            debugLogs, // Whether to enable debug logs.
            supportsJSON: true, // Whether the database supports JSON. (Default: true)
            supportsDates: true, // Whether the database supports dates. (Default: true)
            supportsBooleans: true, // Whether the database supports booleans. (Default: true)
            disableIdGeneration: false, // Whether to disable automatic ID generation. (Default: false)
            supportsNumericIds: true // Whether the database supports numeric IDs. (Default: true)
        },
        adapter: ({ options, getFieldName, getDefaultModelName, getModelName }) => {
            return {
                async create({ data, model }) {
                    if (getDefaultModelName(model) === "session") {
                        if (debugLogs) {
                            console.log(
                                "[Triplit Adapter] Create JWT token for userId:",
                                data[getFieldName({ model, field: "userId" })]
                            )
                        }

                        if (!secretKey && !process.env.BETTER_AUTH_SECRET) {
                            throw new Error(
                                "[Triplit Adapter] No secret key provided. Please provide a secret key or set the BETTER_AUTH_SECRET environment variable."
                            )
                        }

                        // Get the user for this session
                        const user = await httpClient.fetchOne({
                            collectionName: getModelName("user"),
                            where: [["id", "=", data.userId]]
                        })

                        if (!user) {
                            throw new Error("[Triplit Adapter] User not found")
                        }

                        const secret = new TextEncoder().encode(
                            secretKey || process.env.BETTER_AUTH_SECRET
                        )

                        const token = await new SignJWT({
                            sub: user.id,
                            email: user.email,
                            emailVerified: user.emailVerified,
                            name: user.name,
                            role: user.role,
                            username: user.username,
                            exp: Math.floor(new Date(data.expiresAt).getTime() / 1000)
                        })
                            .setProtectedHeader({ alg: "HS256" })
                            .setIssuedAt()
                            .sign(secret || process.env.BETTER_AUTH_SECRET!)
                        const tokenField = getFieldName({ model, field: "token" })

                        // @ts-ignore
                        data[tokenField] = token
                    }

                    if (debugLogs) {
                        console.log("[Triplit Adapter] Insert:", model, JSON.stringify(data))
                    }

                    await httpClient.insert(model, data)

                    return data
                },
                async count({ model, where }) {
                    const parsedWhere = parseWhere(where)

                    if (debugLogs) {
                        console.log(
                            "[Triplit Adapter] Count Fetch:",
                            model,
                            JSON.stringify(parsedWhere)
                        )
                    }

                    const entities = await httpClient.fetch({
                        collectionName: model,
                        where: parseWhere(where)
                    })

                    if (debugLogs) {
                        console.log(
                            "[Triplit Adapter] Count Entities:",
                            model,
                            entities.length,
                            JSON.stringify(entities)
                        )
                    }

                    return entities.length
                },
                async delete({ model, where }) {
                    const parsedWhere = parseWhere(where)

                    if (debugLogs) {
                        console.log(
                            "[Triplit Adapter] Delete Fetch:",
                            model,
                            JSON.stringify(parsedWhere)
                        )
                    }

                    const entities = await httpClient.fetch({
                        collectionName: model,
                        where: parseWhere(where)
                    })

                    if (debugLogs) {
                        console.log(
                            "[Triplit Adapter] Delete Entities:",
                            model,
                            JSON.stringify(entities)
                        )
                    }

                    await Promise.all(entities.map((entity) => httpClient.delete(model, entity.id)))
                },
                async deleteMany({ model, where }) {
                    const parsedWhere = parseWhere(where)

                    if (debugLogs) {
                        console.log(
                            "[Triplit Adapter] Delete Many Fetch:",
                            model,
                            JSON.stringify(parsedWhere)
                        )
                    }

                    const entities = await httpClient.fetch({
                        collectionName: model,
                        where: parseWhere(where)
                    })

                    if (debugLogs) {
                        console.log(
                            "[Triplit Adapter] Delete Many Entities:",
                            model,
                            JSON.stringify(entities)
                        )
                    }

                    await Promise.all(entities.map((entity) => httpClient.delete(model, entity.id)))

                    return entities.length
                },
                async findMany({ model, where, limit, sortBy, offset }) {
                    const parsedWhere = parseWhere(where)
                    const order = sortBy
                        ? ([[sortBy.field, sortBy.direction.toUpperCase()]] as OrderStatement<
                              Models,
                              string
                          >[])
                        : undefined

                    if (debugLogs) {
                        console.log(
                            "[Triplit Adapter] Find Many Fetch:",
                            model,
                            limit,
                            offset,
                            JSON.stringify(order),
                            JSON.stringify(parsedWhere)
                        )
                    }

                    const entities = await httpClient.fetch({
                        collectionName: model,
                        where: parseWhere(where),
                        limit,
                        offset,
                        order
                    })

                    if (debugLogs) {
                        console.log(
                            "[Triplit Adapter] Find Many Entities:",
                            model,
                            JSON.stringify(entities)
                        )
                    }

                    return entities
                },
                async findOne({ model, where }) {
                    const parsedWhere = parseWhere(where)

                    if (debugLogs) {
                        console.log(
                            "[Triplit Adapter] Find One Fetch:",
                            model,
                            JSON.stringify(parsedWhere)
                        )
                    }

                    const entity = await httpClient.fetchOne({
                        collectionName: model,
                        where: parsedWhere
                    })

                    if (debugLogs) {
                        console.log(
                            "[Triplit Adapter] Find One Entity:",
                            model,
                            JSON.stringify(entity)
                        )
                    }

                    return entity
                },
                async update({ model, update, where }) {
                    const parsedWhere = parseWhere(where)

                    if (debugLogs) {
                        console.log(
                            "[Triplit Adapter] Update Fetch:",
                            model,
                            JSON.stringify(parsedWhere)
                        )
                    }

                    const entity = await httpClient.fetchOne({
                        collectionName: model,
                        where: parsedWhere
                    })

                    if (debugLogs) {
                        console.log(
                            "[Triplit Adapter] Update Entity:",
                            model,
                            JSON.stringify(entity),
                            JSON.stringify(update)
                        )
                    }

                    if (!entity) throw new Error("[Triplit Adapter] Entity not found")

                    await httpClient.update(model, entity.id, (entity) => {
                        Object.assign(entity, update)
                    })

                    return { ...entity, ...update }
                },
                async updateMany({ model, update, where }) {
                    const parsedWhere = parseWhere(where)

                    if (debugLogs) {
                        console.log(
                            "[Triplit Adapter] Update Many Fetch:",
                            model,
                            JSON.stringify(parsedWhere)
                        )
                    }

                    const entities = await httpClient.fetch({
                        collectionName: model,
                        where: parsedWhere
                    })

                    if (debugLogs) {
                        console.log(
                            "[Triplit Adapter] Update Many Entities:",
                            model,
                            JSON.stringify(entities)
                        )
                    }

                    await Promise.all(
                        entities.map((entity) =>
                            httpClient.update(model, entity.id, (entity) => {
                                Object.assign(entity, update)
                            })
                        )
                    )

                    return entities.length
                },
                options: { usePlural, debugLogs }
            }
        }
    })
