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

## Usage

```typescript
import { betterAuth } from "better-auth";
import { TriplitClient } from "@triplit/client";
import { triplitAdapter } from '@daveyplate/better-auth-triplit';

// Create a Triplit client
const triplitClient = new TriplitClient({
  serverUrl: "https://your-triplit-server.com",
  token: "your-token" // if needed
});

// Create a Better Auth instance with Triplit adapter
const auth = betterAuth({
  database: triplitAdapter({
    client: triplitClient,
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
| `client` | `TriplitClient` | required | The Triplit client instance |
| `debugLogs` | `boolean` | `false` | Enable detailed logging for debugging |
| `usePlural` | `boolean` | `true` | Whether table names in the schema are plural |
| `transactionHooks` | `object` | `undefined` | Hooks for create and update operations |

## License

MIT