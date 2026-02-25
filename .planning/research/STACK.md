# Technology Stack

**Project:** Privy Auth Template (Solana)
**Researched:** 2026-02-24
**Overall Confidence:** HIGH -- versions verified directly against npm registry

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | ^16.1.6 | App framework with App Router | Next.js 16 is now `latest` on npm and the supabase-auth community template uses 16. Turbopack is the default bundler in 16, which is actually ideal: Privy's Solana webpack externals config is explicitly "not needed if you are using Turbopack." This means zero bundler config required -- simpler template. See "Version Decision" section for full rationale. | HIGH |
| React | ^19.2.0 | UI library | React 19 is stable and Privy peer-deps accept `^18 \|\| ^19`. React 19 gives us use() hook, actions, and server component support. | HIGH |
| React DOM | ^19.2.0 | DOM rendering | Must match React version. | HIGH |
| TypeScript | ^5.9.0 | Type safety | Privy requires TS 5+. Latest 5.9.x provides best inference and performance. | HIGH |

### Authentication & Wallet

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @privy-io/react-auth | ^3.14.1 | Auth provider (social login + embedded wallets) | The entire point of this template. v3.14.1 is latest stable with cross-tab sync, Solana gas sponsorship, and standard wallet hooks. Peer-deps require `@solana/kit >=3.0.3`. | HIGH |
| @solana/kit | ^6.1.0 | Solana SDK (successor to @solana/web3.js) | Required Privy peer dependency. This is the modern Solana JS SDK (formerly web3.js v2). Tree-shakeable, zero external deps, 10x faster crypto ops. DO NOT use @solana/web3.js 1.x -- it is in maintenance mode. | HIGH |
| @solana-program/memo | ^0.11.0 | Memo program client | Required Privy peer dependency (`>=0.8.0`). Needed for memo-attached transactions. | HIGH |
| @solana-program/system | ^0.12.0 | System program client | Required Privy peer dependency (`>=0.8.0`). Needed for SOL transfers and account creation. | HIGH |
| @solana-program/token | ^0.11.0 | Token program client | Required Privy peer dependency (`>=0.6.0`). Needed for SPL token interactions (even if not used directly in the template demo, it is a required peer dep). | HIGH |

### Styling & UI

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | ^4.2.1 | Utility-first CSS | v4 is stable with CSS-first config, automatic content detection, 5x faster builds. Required by the project constraints. The supabase-auth community template uses v4. | HIGH |
| @tailwindcss/postcss | ^4.2.1 | PostCSS plugin for Tailwind v4 | Required for Next.js integration with Tailwind v4. Replaces the old tailwindcss PostCSS plugin. | HIGH |
| shadcn/ui | latest (CLI) | Component library | Not an npm package -- installed via `npx shadcn@latest init`. Generates local component files in `src/components/ui/`. Uses Radix UI primitives + Tailwind. Required by project constraints. | HIGH |
| class-variance-authority | ^0.7.1 | Variant management for components | Required by shadcn/ui for component variant APIs (e.g., Button variants). | HIGH |
| clsx | ^2.1.1 | Conditional class joining | Required by shadcn/ui's `cn()` utility function. | HIGH |
| tailwind-merge | ^3.5.0 | Tailwind class deduplication | Required by shadcn/ui's `cn()` utility to properly merge conflicting Tailwind classes. | HIGH |
| tw-animate-css | ^1.4.0 | Animation utilities | Tailwind v4 animation plugin used by shadcn/ui. Replaces tailwindcss-animate from v3. | HIGH |
| lucide-react | ^0.575.0 | Icon library | Default icon set for shadcn/ui components. Tree-shakeable SVG icons. | HIGH |

### Radix UI Primitives (installed via shadcn/ui)

These are added automatically when you run `npx shadcn@latest add [component]`. Listed here for completeness -- do NOT install manually upfront. Only the components actually used will pull in their Radix primitives.

| Library | Version | Used By |
|---------|---------|---------|
| @radix-ui/react-slot | ^1.2.4 | Button component (Slot for asChild) |
| @radix-ui/react-dialog | ^1.1.15 | Dialog/Modal components |
| @radix-ui/react-dropdown-menu | ^2.1.16 | User menu dropdown |
| @radix-ui/react-avatar | ^1.1.11 | User avatar display |
| @radix-ui/react-label | ^2.1.8 | Form labels |

### Utilities

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| sonner | ^2.0.7 | Toast notifications | Best-in-class toast library for React. Used by shadcn/ui's toast component. Tiny bundle, great DX. | MEDIUM |
| next-themes | ^0.4.6 | Dark/light theme toggle | Standard approach for theme switching with Next.js App Router + Tailwind. | MEDIUM |
| react-error-boundary | ^6.1.1 | Error boundary component | Declarative error boundaries for wallet and auth state errors. Better DX than class-based error boundaries. | MEDIUM |

### Dev Dependencies

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| eslint | ^10.0.2 | Linting | Latest ESLint with flat config. Required by Solana template conventions. | HIGH |
| eslint-config-next | ^16.1.6 | Next.js ESLint rules | Match Next.js version for compatible lint rules. | HIGH |
| prettier | ^3.8.1 | Code formatting | Solana templates use Prettier for consistent formatting. | HIGH |
| @types/node | ^22.0.0 | Node.js type definitions | Required for TypeScript Node.js APIs. | HIGH |
| @types/react | ^19.2.0 | React type definitions | Must match React version. | HIGH |
| @types/react-dom | ^19.2.0 | React DOM type definitions | Must match React DOM version. | HIGH |

## What NOT to Use

| Technology | Why Not | Use Instead |
|------------|---------|-------------|
| @solana/web3.js (v1.x) | Maintenance mode only. No new features. Privy peer-deps point to @solana/kit. The Solana Foundation templates repo marks web3.js templates as "legacy". | @solana/kit |
| @solana/wallet-adapter-* | Unnecessary with Privy. Privy handles wallet connection, embedded wallet creation, and signing internally. Adding wallet-adapter creates conflicting wallet state. | @privy-io/react-auth hooks (useWallets, useSolanaWallets) |
| tailwindcss-animate | Tailwind v3 plugin. Incompatible with Tailwind v4. | tw-animate-css |
| tailwind.config.js | Tailwind v4 uses CSS-first configuration. No JS config file needed. | @import "tailwindcss" in CSS + @theme blocks |
| zustand / redux | Overkill for template state. Auth state comes from Privy hooks. Wallet state comes from Privy hooks. No complex state management needed. | React context + Privy hooks |
| @solana/web3-compat | Compatibility shim for migrating web3.js 1.x code. Not needed for greenfield projects. | Direct @solana/kit usage |
| cookie-based SSR session | Out of scope per PROJECT.md. Document in README as optional best practice. | Client-side auth guards with usePrivy ready state |
| Next.js 15.x | While still supported, 16.x is now `latest` and the supabase-auth community template already uses it. Turbopack default in 16 eliminates the need for Privy's Solana webpack externals config entirely. | Next.js 16.x |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Solana SDK | @solana/kit (v6) | @solana/web3.js (v1.98) | Legacy, maintenance mode, not tree-shakeable, Privy peer-deps require kit |
| CSS Framework | Tailwind v4 | CSS Modules | Project constraint requires Tailwind; v4 is latest stable |
| Component Library | shadcn/ui | Chakra UI, MUI | Project constraint; shadcn is Tailwind-native, tree-shakeable, no runtime |
| Auth Provider | Privy | Dynamic, Web3Auth | Project constraint -- this IS a Privy template |
| State Management | Privy hooks + React context | Zustand, Jotai | Template simplicity; two state domains (auth + wallet) are fully served by Privy hooks |
| Theme | next-themes | Manual implementation | next-themes handles SSR hydration correctly, prevents flash |
| Icons | lucide-react | heroicons, react-icons | shadcn/ui default; tree-shakeable; consistent style |
| Next.js Version | 16.x | 15.x | 16 is now `latest`, Turbopack default simplifies Privy config (no webpack externals needed), and the supabase-auth community template already uses 16 |

## Version Decision: Next.js 16.x

**Recommendation: Use Next.js 16.x (^16.1.6)**

Key evidence:
1. Next.js 16 is now the `latest` tag on npm (16.1.6 as of 2026-02-24)
2. The supabase-auth community template in the Solana Foundation templates repo already uses Next.js 16.0.10
3. Privy's installation docs explicitly state that Solana webpack externals are "not needed if you are using Turbopack"
4. Next.js 16 makes Turbopack the default bundler
5. This means ZERO bundler configuration needed for Privy + Solana -- a simpler, cleaner template

The one consideration: Next.js 16 removes synchronous access to dynamic APIs (cookies, headers, params, searchParams). These must be awaited. Since this template uses client-side auth guards (not SSR/middleware), this breaking change has minimal impact.

**Fallback:** If any Privy compatibility issue surfaces during implementation, fall back to Next.js 15.3.9 (`next-15-3` dist-tag) which is the latest 15.x patch.

## Privy Configuration

### PrivyProvider Setup (from official Solana recipe)

```typescript
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';

const solanaConnectors = toSolanaWalletConnectors();

<PrivyProvider
  appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
  config={{
    solana: {
      rpcs: {
        'solana:devnet': {
          rpc: createSolanaRpc('https://api.devnet.solana.com'),
          rpcSubscriptions: createSolanaRpcSubscriptions('wss://api.devnet.solana.com')
        }
      }
    },
    appearance: {
      showWalletLoginFirst: false,
      walletChainType: 'solana-only'
    },
    loginMethods: ['google', 'discord', 'twitter', 'email'],
    externalWallets: {
      solana: {
        connectors: solanaConnectors
      }
    },
    embeddedWallets: {
      solana: {
        createOnLogin: 'all-users'
      }
    }
  }}
>
```

### Key Privy Hooks for This Template

| Hook | Import | Purpose |
|------|--------|---------|
| `usePrivy` | `@privy-io/react-auth` | Auth state: `ready`, `authenticated`, `user`, `login`, `logout` |
| `useWallets` | `@privy-io/react-auth` | Connected wallets array + `ready` boolean |
| `useSolanaWallets` | `@privy-io/react-auth/solana` | Solana-specific wallet operations + `createWallet` |
| `useLogin` | `@privy-io/react-auth` | Login callback with `onComplete` / `onError` |
| `useSignMessage` | `@privy-io/react-auth` | Sign arbitrary messages (template demo action) |
| `useStandardSignTransaction` | `@privy-io/react-auth` | Sign transactions using @solana/kit transaction format |
| `useStandardSignAndSendTransaction` | `@privy-io/react-auth` | Sign and send transactions |

## create-solana-dapp Template Metadata

The template's `package.json` must include this metadata for CLI compatibility:

```json
{
  "name": "privy-auth",
  "displayName": "Privy Auth",
  "description": "Privy social login with embedded Solana wallets",
  "version": "0.0.0",
  "private": true,
  "usecase": "Auth",
  "keywords": ["privy", "authentication", "solana", "embedded-wallets"],
  "create-solana-dapp": {
    "instructions": [
      "1. Create a Privy account at https://dashboard.privy.io",
      "2. Create a new app and enable Solana embedded wallets",
      "3. Copy your App ID to .env.local as NEXT_PUBLIC_PRIVY_APP_ID",
      "4. Run `pnpm dev` to start the development server"
    ]
  },
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "ci": "npm run build && npm run lint && npm run format:check"
  }
}
```

**Required files for community template submission:**
- `package.json` with metadata above (displayName, usecase, keywords, create-solana-dapp instructions)
- `og-image.png` for template gallery
- `.env.example` with `NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id-here`

## Installation

```bash
# Core framework
npm install next@^16.1.6 react@^19.2.0 react-dom@^19.2.0

# Privy auth + Solana (required peer deps)
npm install @privy-io/react-auth@^3.14.1 @solana/kit@^6.1.0 @solana-program/memo@^0.11.0 @solana-program/system@^0.12.0 @solana-program/token@^0.11.0

# Styling (shadcn/ui deps)
npm install class-variance-authority@^0.7.1 clsx@^2.1.1 tailwind-merge@^3.5.0 tw-animate-css@^1.4.0 lucide-react@^0.575.0

# Utilities
npm install next-themes@^0.4.6 sonner@^2.0.7 react-error-boundary@^6.1.1

# Dev dependencies
npm install -D typescript@^5.9.0 tailwindcss@^4.2.1 @tailwindcss/postcss@^4.2.1 eslint@^10.0.2 eslint-config-next@^16.1.6 prettier@^3.8.1 @types/node@^22.0.0 @types/react@^19.2.0 @types/react-dom@^19.2.0

# Then initialize shadcn/ui
npx shadcn@latest init
# Add components as needed:
npx shadcn@latest add button card dialog dropdown-menu avatar
```

## Sources

### Verified via npm registry (HIGH confidence)
- @privy-io/react-auth: 3.14.1 (verified `npm view` 2026-02-24)
- @privy-io/react-auth peerDependencies: `@solana/kit >=3.0.3`, `@solana-program/memo >=0.8.0`, `@solana-program/system >=0.8.0`, `@solana-program/token >=0.6.0`, `react ^18 || ^19` (verified `npm view` 2026-02-24)
- @solana/kit: 6.1.0 (verified `npm view` 2026-02-24)
- @solana-program/memo: 0.11.0 (verified `npm view` 2026-02-24)
- @solana-program/system: 0.12.0 (verified `npm view` 2026-02-24)
- @solana-program/token: 0.11.0 (verified `npm view` 2026-02-24)
- Next.js: 16.1.6 latest (verified `npm view next dist-tags` 2026-02-24)
- React: 19.2.4 (verified `npm view` 2026-02-24)
- TypeScript: 5.9.3 (verified `npm view` 2026-02-24)
- Tailwind CSS: 4.2.1 (verified `npm view` 2026-02-24)

### Official Documentation (HIGH confidence)
- [Privy Installation](https://docs.privy.io/basics/react/installation) -- peer deps, Solana requirements, Turbopack note: "these configurations are not needed if you are using Turbopack"
- [Privy Solana Getting Started](https://docs.privy.io/recipes/solana/getting-started-with-privy-and-solana) -- PrivyProvider config, hooks, Solana RPC setup
- [Privy @solana/kit Integration](https://docs.privy.io/wallets/connectors/solana/kit-integrations) -- signing and sending with kit, useStandardSignTransaction
- [Privy Solana Wallet Creation](https://docs.privy.io/guide/react/wallets/embedded/solana/creation) -- createOnLogin config options
- [Privy useWallets](https://docs.privy.io/guide/react/wallets/use-wallets) -- wallet array, ready state, connected vs linked distinction
- [Privy Changelog](https://docs.privy.io/reference/sdk/react-auth/changelog) -- v3.14.1 latest, Solana-specific updates

### Ecosystem (MEDIUM confidence)
- [Solana Foundation Templates Repo](https://github.com/solana-foundation/templates) -- community template structure, 16 existing community templates
- [supabase-auth community template](https://github.com/solana-foundation/templates/tree/main/community/supabase-auth) -- reference implementation using Next.js 16, @solana/kit, Tailwind v4, shadcn/ui, identical stack pattern
- [privy-io/examples](https://github.com/privy-io/examples) -- current Privy examples; privy-next-solana starter (archived create-solana-next-app superseded)
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) -- Turbopack default, async dynamic APIs, version status
- [shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next) -- setup guide, React 19 + Tailwind v4 compatible
- [@solana/kit GitHub](https://github.com/anza-xyz/kit) -- SDK successor to web3.js, tree-shakeable, zero deps
- [Anza: Solana Web3.js 2.0 Release](https://www.anza.xyz/blog/solana-web3-js-2-release) -- kit rationale, performance benchmarks

### Version Discrepancy Notes
- Web search reported @solana/kit as 3.0.3 but `npm view` returned 6.1.0. Trust npm registry -- these packages release frequently.
- Web search reported @privy-io/react-auth as 3.8.1 but changelog and npm confirmed 3.14.1.
- The supabase-auth community template references @solana/kit ^5.0.0; current is 6.1.0. Both satisfy Privy's `>=3.0.3` peer dep.
- @solana/web3.js 1.98.4 is the final 1.x release. The successor is @solana/kit, not web3.js 2.x (which was rebranded to kit).
