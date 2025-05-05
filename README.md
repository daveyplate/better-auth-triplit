# Better Auth Triplit Adapter

This package provides an adapter for [Better Auth](https://better-auth.com/) to use [Triplit](https://triplit.dev/) as a database backend.

## Installation

```bash
# Using npm
npm install @daveyplate/better-auth-triplit

# Using yarn
yarn add @daveyplate/better-auth-triplit

# Using pnpm
pnpm add @daveyplate/better-auth-triplit
```

## Auth Schema

### auth-schema.ts
```typescript
import { Schema as S } from "@triplit/client"

export const authSchema = S.Collections({
    users: {
        schema: S.Schema({
            id: S.Id(),
            name: S.String(),
            email: S.String(),
            emailVerified: S.Boolean({ default: false }),
            image: S.Optional(S.String()),
            createdAt: S.Date({ default: S.Default.now() }),
            updatedAt: S.Date({ default: S.Default.now() })
        }),
        relationships: {
            sessions: S.RelationMany("sessions", {
                where: [["userId", "=", "$id"]]
            }),
            accounts: S.RelationMany("accounts", {
                where: [["userId", "=", "$id"]]
            })
        },
        permissions: {
            authenticated: {
                read: {
                    filter: [["id", "=", "$token.sub"]]
                }
            }
        }
    },
    sessions: {
        schema: S.Schema({
            id: S.Id(),
            userId: S.String(),
            token: S.String(),
            expiresAt: S.Date(),
            ipAddress: S.Optional(S.String()),
            userAgent: S.Optional(S.String()),
            createdAt: S.Date({ default: S.Default.now() }),
            updatedAt: S.Date({ default: S.Default.now() })
        }),
        relationships: {
            user: S.RelationById("users", "$userId")
        },
        permissions: {
            authenticated: {
                read: {
                    filter: [["userId", "=", "$token.sub"]]
                }
            }
        }
    },
    accounts: {
        schema: S.Schema({
            id: S.Id(),
            userId: S.String(),
            accountId: S.String(),
            providerId: S.String(),
            accessToken: S.Optional(S.String()),
            refreshToken: S.Optional(S.String()),
            accessTokenExpiresAt: S.Optional(S.Date()),
            refreshTokenExpiresAt: S.Optional(S.Date()),
            scope: S.Optional(S.String()),
            idToken: S.Optional(S.String()),
            password: S.Optional(S.String()),
            createdAt: S.Date({ default: S.Default.now() }),
            updatedAt: S.Date({ default: S.Default.now() })
        }),
        relationships: {
            user: S.RelationById("users", "$userId")
        },
        permissions: {
            authenticated: {
                read: {
                    filter: [["userId", "=", "$token.sub"]]
                }
            }
        }
    },
    verifications: {
        schema: S.Schema({
            id: S.Id(),
            identifier: S.String(),
            value: S.String(),
            expiresAt: S.Date(),
            createdAt: S.Date({ default: S.Default.now() }),
            updatedAt: S.Date({ default: S.Default.now() })
        }),
        permissions: {}
    }
})
```

## Usage

```typescript
import { betterAuth } from "better-auth";
import { HttpClient } from "@triplit/client"
import { schema } from "./schema"

export const httpClient = new HttpClient({
    schema,
    serverUrl: process.env.NEXT_PUBLIC_TRIPLIT_DB_URL,
    token: process.env.TRIPLIT_SERVICE_TOKEN
})

// Create a Better Auth instance with Triplit adapter
const auth = betterAuth({
  database: triplitAdapter({
    httpClient: triplitClient,
    debugLogs: false, // Optional: enable for debugging
    usePlural: true,  // Optional: set to false if your schema uses singular names
  }),
  // Other Better Auth options
});

// Now you can use Better Auth as usual
// auth.signIn(...), auth.signUp(...), etc.
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `httpClient` | `TriplitClient` | required | The Triplit client instance |
| `debugLogs` | `boolean` | `false` | Enable detailed logging for debugging |
| `usePlural` | `boolean` | `true` | Whether table names in the schema are plural |
| `transactionHooks` | `object` | `undefined` | Hooks for create and update operations |

## License

MIT