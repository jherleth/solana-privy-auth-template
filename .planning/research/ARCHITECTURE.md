# Architecture Patterns

**Domain:** Next.js App Router + Privy Auth + Solana Embedded Wallet Template (community template for create-solana-dapp)
**Researched:** 2026-02-24

## Recommended Architecture

This template is a **single Next.js App Router application** with no backend, no database, and no Anchor program. It is a pure client-side auth + wallet demo that scaffolds via `create-solana-dapp`. The architecture is intentionally minimal: a provider shell wrapping page-level feature components.

```
Root Layout (app/layout.tsx)
  |
  +-- Providers (components/providers.tsx) -- 'use client'
  |     |
  |     +-- PrivyProvider (outermost, configures auth + embedded wallets + Solana RPC)
  |           |
  |           +-- {children} -- all pages rendered here
  |
  +-- Pages
        |
        +-- / (Landing) -- public, shows auth status + login CTA
        +-- /dashboard -- authenticated, user info + wallet info + actions
        +-- /protected -- authenticated, demonstrates route guard pattern
```

### Why No Separate Solana ConnectionProvider

Privy's PrivyProvider handles the Solana RPC connection internally via `@solana/kit` (not `@solana/web3.js`). The RPC endpoint is configured in the PrivyProvider's `config.solana.rpcs` property. There is **no need** for a separate `ConnectionProvider` / `WalletProvider` / `WalletModalProvider` stack from `@solana/wallet-adapter-react`. This is a fundamental architectural difference from standard Solana wallet adapter templates:

- **Standard Solana template:** `ConnectionProvider > WalletProvider > WalletModalProvider > App`
- **Privy template:** `PrivyProvider > App`

Privy subsumes all three responsibilities (connection, wallet management, modal UI) into a single provider. This simplifies the architecture significantly.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `app/layout.tsx` | Root layout, imports Providers, global CSS, metadata | Providers |
| `components/providers.tsx` | `'use client'` wrapper containing PrivyProvider with full config | All pages via React context |
| `app/page.tsx` | Landing page: auth status, login CTA, navigate to dashboard | AuthStatus, PrivyProvider (via hooks) |
| `app/dashboard/page.tsx` | Dashboard: user info, wallet state, actions | UserProfile, WalletPanel, ActionsPanel |
| `app/protected/page.tsx` | Protected route demo: redirect if not authenticated | AuthGuard, PrivyProvider (via hooks) |
| `components/auth-status.tsx` | Shows ready/loading/authenticated states, no flicker | usePrivy() hook |
| `components/user-profile.tsx` | Shows DID, linked accounts (Google/Discord/etc), logout button | usePrivy() hook |
| `components/wallet-panel.tsx` | Shows embedded wallet address, create button if missing, connection state | useSolanaWallets() hook, useCreateWallet() hook |
| `components/actions-panel.tsx` | "Sign a message" demo with signature display | useSignMessage() from `@privy-io/react-auth/solana` |
| `components/auth-guard.tsx` | Client-side route guard: redirects to `/` if not authenticated | usePrivy() hook, useRouter() |
| `components/ui/*` | shadcn/ui primitives (Button, Card, Badge, etc) | Only receive props, no Privy/Solana awareness |

### Data Flow

```
User Action                     Data Flow
-----------                     ---------

1. User visits /          -->   usePrivy() checks { ready, authenticated }
                                if !ready: show skeleton/loading
                                if ready && !authenticated: show login CTA
                                if ready && authenticated: show "Go to Dashboard"

2. User clicks Login      -->   login() from useLogin() opens Privy modal
                          <--   Privy modal handles OAuth/email
                          <--   On success: embedded wallet auto-created (config)
                          <--   usePrivy() returns { authenticated: true, user }
                          <--   useSolanaWallets() returns wallet array

3. User visits /dashboard -->   usePrivy() provides user object (DID, linked accounts)
                                useSolanaWallets() provides wallet list
                                Find embedded wallet: wallet where standardWallet.name === 'Privy'
                                Display address, linked accounts, wallet state

4. User signs message     -->   useSignMessage() from @privy-io/react-auth/solana
                                Encode message as Uint8Array
                                signMessage({ message, wallet }) returns signature
                          <--   Display base58-encoded signature

5. User visits /protected -->   AuthGuard checks usePrivy().authenticated
                                If false: redirect to /
                                If true: render children

6. User logs out          -->   logout() from usePrivy()
                          <--   All auth/wallet state cleared
                          <--   Redirect to /
```

## File Structure

This is the recommended file structure conforming to both Next.js App Router conventions and `create-solana-dapp` community template requirements.

```
privy-auth/                          # Template root (placed in community/ when submitted)
|
+-- package.json                     # REQUIRED: name, displayName, description, usecase, keywords, create-solana-dapp
+-- og-image.png                     # REQUIRED: 1200x630 PNG, under 500KB
+-- .env.example                     # NEXT_PUBLIC_PRIVY_APP_ID placeholder
+-- next.config.ts                   # Next.js config (minimal)
+-- tsconfig.json                    # TypeScript config
+-- tailwind.config.ts               # Tailwind + shadcn theme
+-- postcss.config.mjs               # PostCSS for Tailwind
+-- components.json                  # shadcn/ui config (component paths, aliases)
+-- README.md                        # Setup guide, Privy dashboard config, env vars, best practices
|
+-- public/
|   +-- og-image.png                 # Copy for public access
|
+-- src/
    +-- app/
    |   +-- layout.tsx               # Root layout: metadata, fonts, global CSS, <Providers>
    |   +-- page.tsx                 # Landing page (/)
    |   +-- globals.css              # Tailwind directives + shadcn CSS variables
    |   +-- dashboard/
    |   |   +-- page.tsx             # Dashboard page (/dashboard)
    |   +-- protected/
    |       +-- page.tsx             # Protected route demo (/protected)
    |
    +-- components/
    |   +-- providers.tsx            # 'use client' PrivyProvider wrapper with full config
    |   +-- auth-status.tsx          # Auth state display (ready/loading/authenticated)
    |   +-- auth-guard.tsx           # Client-side route protection
    |   +-- user-profile.tsx         # User info: DID, linked accounts, logout
    |   +-- wallet-panel.tsx         # Wallet state: address, create, connection indicator
    |   +-- actions-panel.tsx        # Sign message demo
    |   +-- ui/                      # shadcn/ui primitives
    |       +-- button.tsx
    |       +-- card.tsx
    |       +-- badge.tsx
    |       +-- skeleton.tsx
    |       +-- (others as needed)
    |
    +-- lib/
    |   +-- utils.ts                 # cn() utility for Tailwind class merging
    |
    +-- types/
        +-- privy.ts                 # Type definitions for Privy user, session, wallet summary
```

### Why `src/` Directory

Use `src/` because it is the convention in the existing Solana templates repo (e.g., `supabase-auth`, `x402-template`). The `src/` prefix keeps source code separate from config files and the required `og-image.png` / `package.json` at root.

### Why No `hooks/` Directory

With only 3-4 Privy hooks used directly in components (`usePrivy`, `useSolanaWallets`, `useSignMessage`, `useCreateWallet`), there is no need for a custom hooks layer. The components call Privy hooks directly. If future extensions need custom hooks, add `src/hooks/` then.

### Why No `features/` Directory

The template has only three pages with simple, non-overlapping concerns. Feature-based organization adds cognitive overhead for a demo template. Keep it flat. The `supabase-auth` template uses `features/` because it has cluster management and multiple complex domains -- we do not.

## Package.json Metadata (create-solana-dapp)

The package.json must include these fields for CLI compatibility:

```json
{
  "name": "privy-auth",
  "displayName": "Privy Auth",
  "version": "0.0.0",
  "description": "Social login and Solana embedded wallets with Privy",
  "usecase": "Auth",
  "keywords": ["solana", "privy", "auth", "social-login", "embedded-wallet", "nextjs"],
  "create-solana-dapp": {
    "instructions": [
      "Create a Privy account at https://dashboard.privy.io",
      "Create a new app and copy your App ID",
      "Copy .env.example to .env and add your NEXT_PUBLIC_PRIVY_APP_ID",
      "Run: pnpm install",
      "Run: pnpm dev"
    ]
  }
}
```

**Critical fields:**
- `displayName` -- what appears in the template gallery UI
- `usecase` -- "Auth" categorizes it correctly alongside `supabase-auth`
- `keywords` -- drives search in CLI and template browser
- `create-solana-dapp.instructions` -- post-install steps shown to the user

## PrivyProvider Configuration

The single most important architectural decision is the PrivyProvider configuration. This is the central nervous system of the template.

```typescript
// src/components/providers.tsx
'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

const solanaConnectors = toSolanaWalletConnectors();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          showWalletLoginFirst: false,   // Social login first (that's our differentiator)
          walletChainType: 'solana-only',
        },
        loginMethods: ['google', 'discord', 'twitter', 'email'],
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
```

**Key configuration decisions:**

| Config | Value | Rationale |
|--------|-------|-----------|
| `showWalletLoginFirst` | `false` | Template demonstrates social login as primary flow; wallet login secondary |
| `walletChainType` | `'solana-only'` | Solana template -- no EVM chain confusion |
| `loginMethods` | `['google', 'discord', 'twitter', 'email']` | Matches PROJECT.md requirements for social login |
| `createOnLogin` | `'users-without-wallets'` | Auto-creates embedded wallet on first login, not on every login |
| `externalWallets.solana.connectors` | `toSolanaWalletConnectors()` | Also supports Phantom/Solflare login for power users |

**Note on RPC configuration:** The `config.solana.rpcs` field is only required when using Privy's embedded wallet UIs for transaction signing. For the "sign a message" demo, it is not strictly needed. Include it commented-out in the provider with a note explaining when to enable it (devnet endpoint). This avoids an unnecessary RPC dependency for the basic demo while documenting the pattern for developers who extend the template.

## Patterns to Follow

### Pattern 1: Ready-Gate UI Pattern
**What:** Never render auth-dependent UI until `usePrivy().ready === true`. Show skeleton/loading state instead.
**When:** Every component that reads auth or wallet state.
**Why:** Privy SDK initializes asynchronously. Rendering before `ready` causes flicker (shows "logged out" then snaps to "logged in").

```typescript
// src/components/auth-status.tsx
'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthStatus() {
  const { ready, authenticated, user } = usePrivy();

  if (!ready) {
    return <Skeleton className="h-8 w-32" />;
  }

  if (!authenticated) {
    return <span>Not logged in</span>;
  }

  return <span>Logged in as {user?.id}</span>;
}
```

### Pattern 2: Client-Side Route Guard
**What:** A wrapper component that redirects unauthenticated users. Not middleware.
**When:** Protected pages (/dashboard, /protected).
**Why:** Client-side guards are more reliable in templates (no server-side Privy secret needed), and the PROJECT.md explicitly chose this approach.

```typescript
// src/components/auth-guard.tsx
'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace('/');
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return <LoadingSkeleton />;
  }

  return <>{children}</>;
}
```

### Pattern 3: Wallet Identification
**What:** Filter the wallets array to find the Privy embedded wallet specifically.
**When:** Displaying wallet address, signing messages.
**Why:** `useSolanaWallets()` returns ALL connected wallets (embedded + external). The embedded wallet has `standardWallet.name === 'Privy'`.

```typescript
// Inside wallet-panel.tsx
import { useSolanaWallets } from '@privy-io/react-auth';

const { wallets } = useSolanaWallets();
const embeddedWallet = wallets.find(
  (w) => w.walletClientType === 'privy'
);
```

### Pattern 4: Separated Auth State vs Wallet State
**What:** Keep auth state (authenticated, user, DID, linked accounts) and wallet state (wallets, addresses, signing) as distinct UI concerns.
**When:** Dashboard layout.
**Why:** PROJECT.md explicitly requires "clear separation of auth state and wallet state." Auth comes from `usePrivy()`, wallets from `useSolanaWallets()`. They update independently.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Wrapping PrivyProvider in Additional Solana Providers
**What:** Adding `ConnectionProvider` / `WalletProvider` from `@solana/wallet-adapter-react` alongside PrivyProvider.
**Why bad:** Privy handles the Solana connection internally. Adding wallet adapter providers creates conflicting wallet state, duplicate RPC connections, and confusing provider hierarchy. It also adds unnecessary dependencies.
**Instead:** Use only PrivyProvider. All Solana wallet operations go through Privy's hooks (`useSolanaWallets`, `useSignMessage`, `useSignAndSendTransaction`).

### Anti-Pattern 2: Using `@solana/web3.js` for RPC
**What:** Importing `Connection` from `@solana/web3.js` to create a separate RPC connection.
**Why bad:** Privy's current SDK uses `@solana/kit` internally (the modern Solana JS SDK). Mixing `@solana/web3.js` and `@solana/kit` creates dependency bloat and potential version conflicts. The template should stay on one SDK.
**Instead:** If direct RPC calls are needed beyond Privy hooks, use `@solana/kit` (`createSolanaRpc`). For this template's scope (sign a message), no direct RPC calls are needed.

### Anti-Pattern 3: Server-Side Auth Checks Without PRIVY_APP_SECRET
**What:** Trying to verify Privy tokens in middleware or server components without the secret.
**Why bad:** Server-side verification requires `PRIVY_APP_SECRET`, which is out of scope for this template. Half-implementing it creates a false sense of security.
**Instead:** Client-side route guard only. Document server-side verification as a best practice in README for production apps.

### Anti-Pattern 4: Rendering Auth UI Before `ready`
**What:** Showing login/logout buttons or wallet state before `usePrivy().ready === true`.
**Why bad:** Causes UI flicker. User sees "Not logged in" for a split second then snaps to "Logged in."
**Instead:** Always gate on `ready`. Show skeleton components while initializing.

### Anti-Pattern 5: Deep Component Nesting for State
**What:** Creating custom context providers to pass Privy state down the tree.
**Why bad:** Privy's hooks are already context-based. Re-wrapping in custom contexts adds indirection without value for a template this size.
**Instead:** Call `usePrivy()` and `useSolanaWallets()` directly in the components that need them.

## Build Order (Dependencies Between Components)

Components have clear dependency chains that dictate build order:

```
Phase 1: Foundation (no dependencies)
  - package.json with template metadata
  - next.config.ts, tsconfig.json, tailwind.config.ts
  - .env.example
  - src/app/globals.css
  - src/lib/utils.ts (cn utility)
  - shadcn/ui primitives (button, card, badge, skeleton)

Phase 2: Provider Shell (depends on Phase 1)
  - src/components/providers.tsx (PrivyProvider config)
  - src/app/layout.tsx (imports Providers, wraps children)

Phase 3: Auth Components (depends on Phase 2)
  - src/components/auth-status.tsx (usePrivy hook)
  - src/components/auth-guard.tsx (usePrivy + useRouter)
  - src/components/user-profile.tsx (usePrivy for user info + logout)

Phase 4: Wallet Components (depends on Phase 2, parallel with Phase 3)
  - src/components/wallet-panel.tsx (useSolanaWallets + useCreateWallet)

Phase 5: Action Components (depends on Phase 3 + 4)
  - src/components/actions-panel.tsx (useSignMessage, needs wallet reference)

Phase 6: Pages (depends on Phase 3 + 4 + 5)
  - src/app/page.tsx (uses AuthStatus)
  - src/app/dashboard/page.tsx (uses UserProfile, WalletPanel, ActionsPanel)
  - src/app/protected/page.tsx (uses AuthGuard)

Phase 7: Polish (depends on Phase 6)
  - og-image.png (1200x630)
  - README.md (full setup guide, Privy dashboard config, env vars, best practices)
  - Final package.json refinement
```

**Critical path:** Provider shell must exist before any auth/wallet component can be developed or tested. The `providers.tsx` file is the keystone.

## Scalability Considerations

This is a **template**, not a production app. Scalability refers to how well the pattern scales as developers extend the template.

| Concern | Template Scope | If Extended to Production |
|---------|---------------|--------------------------|
| Provider nesting | Single PrivyProvider, trivial | Add SWR/TanStack Query provider for data fetching as needed |
| State management | Privy hooks only, no external store | Add Zustand/Jotai if complex client state emerges |
| Route protection | Client-side guard component | Add Next.js middleware with PRIVY_APP_SECRET for SSR verification |
| RPC calls | None (sign message only) | Configure `config.solana.rpcs` with custom RPC (Helius/QuickNode) |
| Component count | ~8 custom components | Extract to `features/` directories if feature domains multiply |
| Wallet operations | Sign message only | Add `useSignAndSendTransaction` for transfers; SPL token integration via `@solana/kit` |

## Sources

- [Privy React SDK Setup](https://docs.privy.io/basics/react/setup) -- PrivyProvider configuration, props, App Router setup (MEDIUM confidence, official docs)
- [Privy Getting Started with Solana](https://docs.privy.io/recipes/solana/getting-started-with-privy-and-solana) -- Complete Solana config, hooks, RPC setup, @solana/kit usage (MEDIUM confidence, official docs)
- [Privy Solana Wallet Creation](https://docs.privy.io/guide/react/wallets/embedded/solana/creation) -- createOnLogin options (MEDIUM confidence, official docs)
- [Privy useWallets Hook](https://docs.privy.io/guide/react/wallets/use-wallets) -- Wallet identification, embedded vs external (MEDIUM confidence, official docs)
- [Privy create-solana-next-app (archived)](https://github.com/privy-io/create-solana-next-app) -- Reference template structure, archived Jan 2026 (LOW confidence, archived)
- [Privy examples repo](https://github.com/privy-io/examples) -- privy-next-solana example as current reference (MEDIUM confidence, official GitHub)
- [Solana Foundation Templates Repo](https://github.com/solana-foundation/templates) -- Template organization, community/ structure (HIGH confidence, official repo)
- [Community Template Contributor Guide](https://github.com/solana-foundation/templates/blob/main/COMMUNITY_TEMPLATE_GUIDE.md) -- Required metadata, og-image specs, package.json fields (HIGH confidence, official guide)
- [Supabase Auth Template](https://github.com/solana-foundation/templates/tree/main/community/supabase-auth) -- Reference for src/ structure, auth component patterns (HIGH confidence, existing template in same repo)
- [X402 Template package.json](https://raw.githubusercontent.com/solana-foundation/templates/main/community/x402-template/package.json) -- Metadata field examples (HIGH confidence, existing template)
