# Project Research Summary

**Project:** Privy Auth Template (Solana)
**Domain:** Solana dApp community template with social login + embedded wallet authentication
**Researched:** 2026-02-24
**Confidence:** HIGH

## Executive Summary

This project is a community template for the Solana Foundation's `create-solana-dapp` CLI that demonstrates Privy-powered social login (Google, Discord, Twitter, email) with automatic embedded Solana wallet creation. It will be the first Privy template in the Solana templates gallery, filling a gap between the wallet-only Supabase Auth template and the limited Google/Apple-only Phantom Embedded templates. The template is a pure client-side Next.js App Router application with zero backend, zero database, and zero Anchor program -- intentionally minimal to serve as a clean starting point for consumer-facing dApps that need non-crypto-native onboarding.

The recommended approach is a Next.js 16 + React 19 + Tailwind v4 + shadcn/ui stack with Privy v3 (`@privy-io/react-auth ^3.14.1`) and the modern `@solana/kit` SDK. Next.js 16 is the key stack decision: its Turbopack default eliminates the Privy-specific webpack externals configuration entirely, resulting in zero bundler config -- a meaningful simplification for a template. The architecture is a single PrivyProvider wrapping three pages (landing, dashboard, protected route) with ~8 custom components. Privy subsumes the entire `ConnectionProvider > WalletProvider > WalletModalProvider` chain that standard Solana templates require, so the provider hierarchy is flat and simple.

The primary risks are: (1) using outdated Privy v2 API patterns from stale tutorials and training data, which will cause hard build failures against the v3 SDK; (2) auth state flicker from not gating on `usePrivy().ready` before rendering; and (3) confusing Privy's auth readiness with wallet readiness, which are independent async states. All three are well-documented with clear prevention patterns. The template submission itself has strict metadata requirements (`displayName`, `usecase`, `og-image.png` at exactly 1200x630px) that must be validated against the templates repo's lint checks before PR.

## Key Findings

### Recommended Stack

The stack is fully verified against npm registry and Privy peer dependency requirements. Every version is pinned to current stable releases. See [STACK.md](./STACK.md) for complete version table and rationale.

**Core technologies:**
- **Next.js 16.1.6**: App framework -- Turbopack default eliminates Privy's Solana webpack externals config entirely
- **React 19.2.0**: UI library -- Privy peer-deps accept `^18 || ^19`; React 19 provides use() hook and server component support
- **@privy-io/react-auth 3.14.1**: Auth provider -- social login, embedded wallets, cross-tab sync, Solana gas sponsorship
- **@solana/kit 6.1.0**: Modern Solana SDK (successor to @solana/web3.js) -- required Privy peer dependency, tree-shakeable, 10x faster crypto ops
- **Tailwind CSS 4.2.1**: Utility-first CSS with CSS-first configuration -- no JS config file needed
- **shadcn/ui (CLI)**: Component library generating local files -- Radix primitives + Tailwind, zero runtime

**Critical exclusions (do NOT use):**
- `@solana/web3.js` -- maintenance mode, replaced by `@solana/kit`
- `@solana/wallet-adapter-*` -- Privy handles all wallet management internally; adding adapter creates conflicting state
- `zustand/redux` -- overkill; auth + wallet state fully served by Privy hooks
- `tailwindcss-animate` -- incompatible with Tailwind v4; use `tw-animate-css`

### Expected Features

See [FEATURES.md](./FEATURES.md) for complete feature landscape with competitive positioning.

**Must have (table stakes):**
- Template infrastructure: `package.json` metadata, `.env.example`, `og-image.png`, README with zero-to-running setup
- PrivyProvider configuration with Solana chain support and `createOnLogin`
- Social login (Google, Discord, Twitter, email) -- the entire reason this template exists
- Embedded Solana wallet auto-creation on first login
- Auth state management with ready-gate pattern (no flicker)
- Login/logout flow with landing page CTA
- Wallet address display and sign message demo
- Protected route with client-side auth guard
- Dashboard page showing user info, wallet state, and actions

**Should have (differentiators):**
- User profile with linked accounts (DID, social providers) -- unique to Privy
- Clear visual separation of auth state vs wallet state
- Signature result display with copy-to-clipboard
- Dark/light theme toggle via `next-themes`
- Type-safe Privy user type definitions
- Comprehensive inline code comments (template is educational)

**Defer (anti-features, explicitly out of scope):**
- Server-side Privy verification (requires secret, adds backend complexity)
- Token transfers / SPL token interactions (scope creep beyond sign message demo)
- Cookie-based SSR session / middleware auth
- External wallet connection (Phantom/Solflare extension)
- Fiat on-ramp, account abstraction, private key export
- Real-time balance display, database/persistent storage

### Architecture Approach

The architecture is a single-provider shell: PrivyProvider wraps the entire app, eliminating the traditional three-provider Solana stack. All auth and wallet state comes from Privy hooks called directly in components -- no custom context providers, no state management library. The file structure follows the `src/` directory convention used by existing Solana templates, with ~8 custom components organized flat (no `features/` or `hooks/` directories needed at this scale). See [ARCHITECTURE.md](./ARCHITECTURE.md) for full component boundaries, data flow diagrams, and code patterns.

**Major components:**
1. **`components/providers.tsx`** -- `'use client'` wrapper containing PrivyProvider with full Solana config; the keystone file
2. **`components/auth-guard.tsx`** -- Client-side route protection: gates on `ready`, redirects if not `authenticated`
3. **`components/auth-status.tsx`** -- Ready-gate UI showing skeleton/loading/authenticated states
4. **`components/user-profile.tsx`** -- DID, linked social accounts, logout button
5. **`components/wallet-panel.tsx`** -- Embedded wallet address, create button if missing, connection state
6. **`components/actions-panel.tsx`** -- Sign message demo with signature display
7. **Three pages** -- `/` (landing), `/dashboard` (authenticated hub), `/protected` (route guard demo)

**Key patterns:**
- Ready-gate pattern: always check `ready` before `authenticated` to prevent flicker
- Wallet identification: filter `useSolanaWallets()` for `walletClientType === 'privy'` to find embedded wallet
- Separated concerns: auth state (`usePrivy`) and wallet state (`useSolanaWallets`) tracked independently

### Critical Pitfalls

See [PITFALLS.md](./PITFALLS.md) for complete pitfall catalog with code examples and detection strategies.

1. **Privy v2 vs v3 API mismatch** -- Most tutorials reference removed v2 APIs (`useSolanaWallets` from root, `ConnectedSolanaWallet`, `createOnLogin` in provider config). Pin to v3.x, import Solana hooks from `@privy-io/react-auth/solana`, verify every import against current changelog.
2. **Auth state flicker** -- Rendering auth-dependent UI before `usePrivy().ready === true` causes login page flash. Always gate on `ready` first, show skeleton components during initialization.
3. **Wallet ready vs auth ready confusion** -- `usePrivy().ready` and `useWallets().ready` are independent async states. Track both; do not assume wallets are available when auth is ready.
4. **Missing webpack externals (webpack only)** -- If using webpack (not Turbopack), `@solana/kit` and `@solana-program/*` packages must be configured as externals in `next.config.ts`. Next.js 16 with Turbopack default eliminates this pitfall entirely -- a key reason to choose Next.js 16.
5. **PrivyProvider in Server Component** -- Must be wrapped in a `'use client'` component, not placed directly in `app/layout.tsx`. Create dedicated `providers.tsx`.
6. **Template submission metadata** -- `displayName`, `usecase`, `og-image.png` (1200x630px, PNG, <500KB) must be exact. Validate with `pnpm lint` in templates repo before PR.

## Implications for Roadmap

Based on combined research, the template has clear dependency chains that dictate three phases. The architecture is intentionally simple, so phases are compact.

### Phase 1: Foundation and Provider Shell

**Rationale:** Everything depends on the PrivyProvider being correctly configured. The provider is the keystone -- no auth, wallet, or page component can be developed or tested without it. Template metadata and project scaffolding are prerequisites with zero dependencies.

**Delivers:** A running Next.js 16 app with PrivyProvider configured, Tailwind v4 + shadcn/ui initialized, template metadata in place, and `.env.example` ready. The app should show the Privy login modal when clicking a button.

**Features addressed:**
- Template infrastructure (package.json metadata, .env.example, next.config.ts)
- PrivyProvider configuration with Solana chain support
- shadcn/ui initialization with base components (Button, Card, Badge, Skeleton)
- `providers.tsx` with `'use client'` wrapper
- Root layout with Providers wrapper
- `lib/utils.ts` with `cn()` utility

**Pitfalls to avoid:**
- Privy v2 vs v3 API mismatch (pin to v3.x from the start)
- PrivyProvider in Server Component (create `providers.tsx` immediately)
- Missing webpack externals (mitigated by Next.js 16 + Turbopack default)
- Hardcoded environment variables (use `.env.example` with placeholder)
- Mixing `@solana/web3.js` and `@solana/kit` (install only `@solana/kit`)

### Phase 2: Auth and Wallet Components + Pages

**Rationale:** With the provider shell in place, auth components and wallet components can be built in parallel (both depend on PrivyProvider but not on each other). Pages compose these components. The sign message action depends on having a wallet reference, so it comes after wallet panel.

**Delivers:** The complete three-page application: landing page with login CTA, dashboard with user profile + wallet panel + sign message action, and protected route demo. Full login-to-sign-message flow working end-to-end.

**Features addressed:**
- Auth state management with ready-gate pattern
- Login/logout flow
- Landing page with auth status and login CTA
- Auth guard for protected routes
- Embedded wallet creation and display
- Wallet address display with state handling
- Sign message demo with signature display
- User profile with linked accounts
- Dashboard page composing all panels
- Protected route with redirect
- Separation of auth state vs wallet state in UI
- Dark/light theme toggle

**Pitfalls to avoid:**
- Auth state flicker (ready-gate pattern in every auth-dependent component)
- Wallet ready vs auth ready confusion (track both `ready` states independently)
- `createOnLogin` silent failure (configure in Privy Dashboard for v3, add `useCreateWallet` fallback)
- Message encoding errors in signMessage (use string directly, not Uint8Array)
- Linked vs connected wallets confusion (use `useWallets()` for actions, `linkedAccounts` for info only)

### Phase 3: Polish and Submission Prep

**Rationale:** Once the app is functionally complete, polish and template-specific packaging are needed for submission. This includes the og-image, comprehensive README, inline code comments, type definitions, and validation against the templates repo lint checks. This phase also includes testing the full `create-solana-dapp --template` CLI flow.

**Delivers:** A submission-ready template that passes `pnpm lint` in the templates repo, has a complete README with Privy dashboard setup instructions, and works when scaffolded via the CLI.

**Features addressed:**
- og-image.png (1200x630px, PNG, <500KB)
- Comprehensive README (zero-to-running setup, Privy dashboard config, env vars, best practices, "Next Steps" section)
- Comprehensive inline code comments explaining every Privy hook and config option
- Type-safe Privy user type definitions (`types/privy.ts`)
- Copy-to-clipboard for signature result
- Final package.json refinement (create-solana-dapp instructions block)
- CLI scaffolding test
- Conventional commit format for templates repo PR

**Pitfalls to avoid:**
- Template submission metadata missing or malformed (validate with `pnpm lint`)
- og-image.png wrong dimensions or size
- Not testing with `create-solana-dapp --template` CLI flow
- Non-conventional commit messages for templates repo PR
- API keys or personal config committed

### Phase Ordering Rationale

- **Phase 1 before Phase 2:** PrivyProvider is the architectural keystone. Without it, no Privy hook works, no auth state exists, and no component can be developed or tested. This is the hardest dependency in the project.
- **Phase 2 is the bulk of the work:** Auth components, wallet components, and pages can be built incrementally within this phase. The internal order follows the dependency chain: auth-status and auth-guard first (they only need `usePrivy`), then wallet-panel (needs `useSolanaWallets`), then actions-panel (needs wallet reference from wallet-panel), then pages compose everything.
- **Phase 3 after Phase 2:** Polish and submission prep require the application to be functionally complete. README screenshots, CLI testing, and lint validation all need a working app.
- **This order avoids all critical pitfalls:** Phase 1 establishes correct SDK versions and provider patterns before any feature code is written. Phase 2 builds on a verified foundation with ready-gate patterns from the start. Phase 3 validates everything against the actual submission requirements.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Verify Privy v3 PrivyProvider config against current docs at implementation time. The v2-to-v3 migration changed `createOnLogin` from code config to dashboard-only -- confirm this is still the case. Also verify Next.js 16 compatibility with Privy at install time (fallback: Next.js 15.3.9).
- **Phase 2:** The `useSignMessage` API encoding requirements should be tested early. Privy's signing hooks have specific string vs Uint8Array behavior that tutorials frequently get wrong.

Phases with standard patterns (skip deeper research):
- **Phase 3:** Template submission requirements are well-documented in the Community Template Contributor Guide. The og-image, metadata, and CLI compatibility patterns are straightforward and verified against multiple existing templates.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via `npm view` on 2026-02-24. Privy peer dependencies confirmed. Next.js 16 Turbopack behavior confirmed via Privy docs. |
| Features | HIGH (table stakes) / MEDIUM (differentiators) | Table stakes verified against template requirements and existing accepted templates. Differentiators are inferred from competitive analysis -- bounty scoring criteria are not public. |
| Architecture | HIGH | Pattern directly follows Privy's official Solana recipe and mirrors the existing supabase-auth community template structure. Single-provider architecture is well-documented. |
| Pitfalls | HIGH | 13 of 15 pitfalls sourced from official Privy documentation. v2/v3 migration pitfall verified via changelog and official announcement. |

**Overall confidence:** HIGH

### Gaps to Address

- **Privy v3 `createOnLogin` behavior:** Research indicates this moved to dashboard-only config in v3, but the PrivyProvider code sample in ARCHITECTURE.md still includes it. Validate at implementation time whether `embeddedWallets.solana.createOnLogin` is accepted in v3 config or must be set exclusively in the Privy Dashboard.
- **Next.js 16 + Privy compatibility:** No existing Privy template uses Next.js 16. The supabase-auth template (which is not a Privy template) uses 16. If any Privy-specific compatibility issue surfaces, fall back to Next.js 15.3.9. Test early in Phase 1.
- **`usecase` field value:** PITFALLS.md lists valid values as "Starter, Payments, Airdrop, DeFi, NFT, Gaming" but FEATURES.md and ARCHITECTURE.md use "Auth" (matching the supabase-auth template). Validate which value is accepted by the templates repo lint. If "Auth" is not in the allowed set, use "Starter" as fallback.
- **Privy's Solana hooks import path in v3:** The research found conflicting information. PITFALLS.md says `useSolanaWallets` was renamed to `useWallets` (from `@privy-io/react-auth/solana`), but STACK.md lists `useSolanaWallets` as a current hook. Confirm the correct hook name and import path against the v3.14.1 API reference at implementation time.

## Sources

### Primary (HIGH confidence)
- [Privy React Auth npm registry](https://www.npmjs.com/package/@privy-io/react-auth) -- version 3.14.1, peer dependencies verified
- [Privy + Solana Getting Started Recipe](https://docs.privy.io/recipes/solana/getting-started-with-privy-and-solana) -- PrivyProvider config, hooks, RPC setup
- [Privy React SDK Setup](https://docs.privy.io/basics/react/setup) -- App Router integration, "use client" requirement
- [Privy @solana/kit Integration](https://docs.privy.io/wallets/connectors/solana/kit-integrations) -- signing, transactions
- [Privy Changelog](https://docs.privy.io/reference/sdk/react-auth/changelog) -- v3 migration, current API surface
- [Privy Authentication State](https://docs.privy.io/authentication/user-authentication/authentication-state) -- ready/authenticated pattern
- [Privy useWallets](https://docs.privy.io/guide/react/wallets/use-wallets) -- wallet readiness, connected vs linked
- [Privy Automatic Wallet Creation](https://docs.privy.io/basics/react/advanced/automatic-wallet-creation) -- createOnLogin behavior
- [Solana Foundation Templates Repo](https://github.com/solana-foundation/templates) -- community template structure, COMMUNITY_TEMPLATE_GUIDE.md
- [Community Template Contributor Guide](https://github.com/solana-foundation/templates/blob/main/COMMUNITY_TEMPLATE_GUIDE.md) -- metadata, og-image, lint requirements
- [@solana/kit npm registry](https://www.npmjs.com/package/@solana/kit) -- version 6.1.0 verified
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) -- Turbopack default, version status

### Secondary (MEDIUM confidence)
- [Supabase Auth community template](https://github.com/solana-foundation/templates/tree/main/community/supabase-auth) -- reference implementation, stack validation
- [Privy examples repo](https://github.com/privy-io/examples) -- privy-next-solana starter patterns
- [Privy create-solana-next-app (archived Jan 2026)](https://github.com/privy-io/create-solana-next-app) -- historical reference, archived
- [shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next) -- setup guide, React 19 + Tailwind v4 compatible
- [Anza: Solana Web3.js 2.0 Release](https://www.anza.xyz/blog/solana-web3-js-2-release) -- kit rationale, migration context

### Tertiary (LOW confidence)
- [Privy Solana Modernization Announcement](https://x.com/privy_io/status/1969058996725178635) -- v3 changes, needs validation against docs
- Privy Stripe acquisition context (June 2025) -- future roadmap implications, not actionable now

---
*Research completed: 2026-02-24*
*Ready for roadmap: yes*
