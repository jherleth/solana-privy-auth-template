# Feature Landscape

**Domain:** Solana dApp community template with Privy authentication
**Researched:** 2026-02-24
**Confidence:** MEDIUM (verified against Privy docs, Solana Foundation template requirements, and existing template analysis)

## Table Stakes

Features that MUST be present or the template submission will be rejected or considered incomplete. Derived from: Solana Foundation community template requirements, existing accepted templates (Supabase Auth, Phantom Embedded), and Privy's own starter examples.

### Template Infrastructure (Submission Requirements)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `package.json` with `displayName`, `description`, `usecase`, `keywords` | Required by COMMUNITY_TEMPLATE_GUIDE.md -- template will not pass `pnpm lint` without these | Low | `usecase` should be "Auth" to match the Supabase Auth template category. Description under 100 chars. |
| `og-image.png` (1200x630px, <500KB) | Required by COMMUNITY_TEMPLATE_GUIDE.md -- rejection without it | Low | Can generate with `pnpm create-image "Privy Auth" community/privy-auth` from the templates repo |
| `.env.example` with `NEXT_PUBLIC_PRIVY_APP_ID` | Every auth template needs env config; Phantom and Supabase templates both do this | Low | Placeholder only -- no secrets committed |
| README with zero-to-running setup | Expected by all Solana templates; Supabase Auth template has comprehensive setup guide | Med | Must cover: Privy dashboard setup, env vars, `pnpm install && pnpm dev`, devnet config |
| `create-solana-dapp` init script compatibility | Templates use `"create-solana-dapp"` key in package.json for post-install instructions, rename maps, and version checks | Low | Include instructions block that tells user to set up Privy App ID |
| Next.js App Router + TypeScript + Tailwind CSS | All modern Solana web templates use this stack; it is the de facto convention | Med | Supabase Auth uses Next.js 15, shadcn/ui, Tailwind. Match this. |

### Core Authentication Features

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| PrivyProvider configuration with Solana chain support | Foundational -- nothing works without this. Every Privy example starts here. | Low | Config: `embeddedWallets.solana.createOnLogin`, login methods, appearance |
| Social login (Google, Discord, Twitter, email) | THE differentiator of Privy vs wallet-only auth. Phantom template only has Google/Apple. This is why someone picks a Privy template. | Med | Configure via `loginMethods` in PrivyProvider config. Privy modal handles UI. |
| Embedded Solana wallet creation | Core Privy value prop. `createOnLogin: 'users-without-wallets'` is the recommended setting from Privy's Solana getting-started recipe. | Low | Automatic on login via config. Manual creation via `useSolanaWallets().createWallet` as fallback. |
| Auth state management (ready/loading/authenticated) | Privy docs emphasize gating on `ready` before rendering. Without this, users see flicker and broken states. Supabase Auth template handles this. | Med | `usePrivy()` returns `ready` and `authenticated`. Must gate ALL auth-dependent UI on `ready === true`. |
| Login/Logout flow | Table stakes for any auth template. Every Privy example demonstrates this. | Low | `useLogin()` hook for login, `usePrivy().logout()` for logout |
| Landing page with login CTA | Every auth template has a clear entry point. Supabase Auth has "Sign in with Solana" card. Phantom has connect button. | Med | Show auth status, login button when unauthenticated, "Go to dashboard" when authenticated |

### Core Wallet Features

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Wallet address display | Both Phantom and Supabase Auth templates show wallet address. Basic expectation. | Low | From `useSolanaWallets()` hook -- get embedded wallet address |
| Sign message demo | Present in EVERY Privy example (create-solana-next-app, create-privy-pwa, getting-started recipe). The canonical Privy demo action. | Med | `useSignMessage` from `@privy-io/react-auth/solana`. Display signature result. |
| Wallet state display (exists/missing/connected) | Privy creates wallets asynchronously. Users need clear feedback on wallet state. Missing from many tutorials but critical for UX. | Med | Show: no wallet yet (with create button), wallet exists (with address), wallet ready for actions |

### Route Structure

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Protected route with auth guard | Supabase Auth template has `/account` protected route. Standard pattern in auth demos. | Med | Client-side redirect when `!authenticated`. Check `ready` first to avoid premature redirect. |
| Dashboard page post-login | Privy's own create-solana-next-app has `/dashboard`. Standard landing after auth. | Med | Show user info, wallet info, available actions |

**Confidence: HIGH** -- These features are directly verified against Privy docs, the COMMUNITY_TEMPLATE_GUIDE.md requirements, and multiple existing accepted templates.

## Differentiators

Features that set this template apart from the Phantom Embedded and Supabase Auth templates already in the Solana templates gallery. Not required for acceptance, but valued for bounty scoring and developer adoption.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| User profile with linked accounts display | Privy uniquely supports showing DID, linked social accounts (Google, Discord, etc.), and wallet addresses in one view. Neither Phantom nor Supabase templates show this. | Med | `usePrivy().user` returns linked accounts array. Display each provider with icon/label. |
| Multiple login method demo (not just wallet) | Supabase Auth is wallet-only (Phantom/Solflare). Phantom is Google/Apple only. A Privy template showing 4+ methods (Google, Discord, Twitter, email) is genuinely differentiated. | Low | Configuration-level -- Privy modal handles the UI. Value is in showing the breadth. |
| shadcn/ui component library integration | Supabase Auth already uses shadcn/ui, so matching this is smart. But going further with well-structured Card/Button/Badge components for auth states shows polish. | Med | Cards for user profile, wallet status, action panels. Consistent design language. |
| Clear separation of auth state vs wallet state | Most tutorials conflate "logged in" with "has wallet." Privy separates these -- user can be authenticated but not yet have a wallet. Demonstrating this clearly is educational. | Med | Two distinct UI panels: Auth panel (user/session) and Wallet panel (address/actions). Explicit state machine. |
| Signature result display with copy-to-clipboard | Phantom template shows balance. Supabase template shows account. Neither displays cryptographic output. Showing a signed message result makes the template more useful for learning. | Low | After signing, display signature bytes in a styled code block with copy button. |
| Dark/light theme toggle | Phantom Embedded JS template has this. Shows polish and is expected in modern templates. Easy with Tailwind + shadcn/ui. | Low | `next-themes` provider, toggle button in header. shadcn/ui has built-in dark mode support. |
| Type-safe Privy user objects | Privy's TypeScript types are adequate but verbose. Providing clean type definitions (`PrivyUserSummary`, `WalletSummary`, `SessionInfo`) makes the template more developer-friendly. | Low | Thin wrapper types in `types/privy.ts`. Educational for developers learning the SDK. |
| Comprehensive inline code comments | Templates are educational resources. Well-commented code explaining WHY each Privy hook/config is used dramatically increases value. | Low | Comment every PrivyProvider config option, every hook usage, every state check. |

**Confidence: MEDIUM** -- Differentiators are based on competitive analysis of existing templates and Privy's unique capabilities. Bounty scoring criteria are not publicly documented, so "what differentiates" is inferred.

## Anti-Features

Features to explicitly NOT build. Building these would increase scope without increasing template value, or would make the template harder to maintain/understand.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Server-side Privy verification (PRIVY_APP_SECRET) | Requires server secret, adds backend complexity, not needed for a demo template. Privy's getting-started recipe is client-only. | Document in README as "Production Best Practice" with link to Privy server-side verification docs |
| Token transfers / SPL token interactions | Scope creep. Sign message is the canonical demo. Token transfers require funding wallets, handling errors, and explaining SPL token concepts. | Sign message is sufficient. Document "Next Steps" in README pointing to Privy transaction docs. |
| Mainnet deployment | Template is a demo. Mainnet means real money, RPC costs, and liability. Every Solana template defaults to devnet. | Devnet only. Document mainnet switch (RPC URL change) in README. |
| Cookie-based SSR session / middleware auth | Complex, framework-version-dependent, and fragile in templates. Privy's own examples use client-side auth. Supabase Auth uses middleware but it is core to Supabase's model. | Client-side route guard with `usePrivy().ready` and `authenticated`. Document middleware approach in README as best practice. |
| External wallet connection (Phantom/Solflare browser extension) | Muddies the template's purpose. This is a PRIVY template -- the value is social login + embedded wallets. External wallet connection is the domain of the base Solana templates. | Focus on embedded wallets only. Mention external wallet support in README as optional Privy feature. |
| Fiat on-ramp / Bridge integration | Post-Stripe-acquisition feature. Premature for a community template. Adds significant complexity and potential API key requirements. | Mention as "Future Enhancement" in README. Privy + Stripe integration is still evolving. |
| Account abstraction / smart wallets | Advanced Privy feature, EVM-focused. Solana does not use the same AA model. Over-engineering for a demo. | Out of scope entirely. Not relevant to Solana embedded wallets. |
| Mobile-specific layouts | Template must be responsive but building dedicated mobile layouts is scope creep. Tailwind responsive utilities are sufficient. | Use Tailwind responsive classes. Test on mobile viewport. No dedicated mobile components. |
| Private key export | Privy supports this but it is a security-sensitive feature that could confuse beginners. Privy's own PWA template includes it but it was archived. | Omit entirely. Do not expose private key export in a demo template. |
| Multi-wallet management (multiple embedded wallets) | Privy supports creating multiple wallets but this is an advanced use case that complicates the demo. | One embedded wallet per user. Document multi-wallet in README as advanced topic. |
| Real-time balance display with auto-refresh | Phantom template does this with 30s polling. Adds RPC call complexity, balance formatting, and devnet SOL confusion. | Show wallet address only. If user wants balance, they can check on explorer. Link to devnet faucet in README. |
| Database / persistent storage | Template should be stateless. No Supabase, no PostgreSQL, no user data storage beyond Privy's built-in user management. | Privy handles all user/wallet data. Template has zero backend state. |

**Confidence: HIGH** -- Anti-features are well-supported by the project's explicit "Out of Scope" in PROJECT.md and by analysis of what makes templates maintainable vs over-engineered.

## Feature Dependencies

```
PrivyProvider config --> Auth state management (ready/authenticated)
Auth state management --> Login/Logout flow
Auth state management --> Protected route guard
Auth state management --> Landing page auth status
Login/Logout flow --> Embedded wallet creation (wallet created on login)
Embedded wallet creation --> Wallet state display
Embedded wallet creation --> Wallet address display
Wallet state display --> Sign message demo (requires wallet to exist)
Sign message demo --> Signature result display

shadcn/ui setup --> All UI components
Tailwind config --> shadcn/ui setup
next-themes --> Dark/light theme toggle

package.json metadata --> Template submission compatibility
og-image.png --> Template submission compatibility
README --> Template submission compatibility
.env.example --> PrivyProvider config
```

Critical path: `.env.example` --> `PrivyProvider` --> `Auth state` --> `Login flow` --> `Wallet creation` --> `Sign message`

## MVP Recommendation

### Prioritize (in build order):

1. **Template infrastructure** -- package.json metadata, .env.example, og-image.png, README skeleton. Without these, the template cannot be submitted.
2. **PrivyProvider + auth state** -- The foundation everything depends on. Get `ready`/`authenticated` working correctly first.
3. **Social login flow** -- The template's reason for existing. Must work with Google, Discord, Twitter, email.
4. **Embedded wallet creation + display** -- Second core value prop. Show wallet address, handle "no wallet yet" state.
5. **Landing page + Dashboard + Protected route** -- Three-page structure gives the template substance and demonstrates real patterns.
6. **Sign message demo** -- The canonical Privy action. Proves the wallet works.
7. **User profile with linked accounts** -- One differentiator. Shows Privy's unique multi-provider identity model.
8. **Polish** -- Dark/light theme, comprehensive comments, type definitions, copy-to-clipboard for signature.

### Defer:

- **Real-time balance display**: Low value relative to complexity. Wallet address + explorer link is sufficient.
- **Transaction sending**: Sign message is the right demo scope. Transactions require funded wallets.
- **Server-side verification**: Document only. Client-side auth is appropriate for a template.

## Competitive Positioning

| Feature | This Template (Privy Auth) | Supabase Auth | Phantom Embedded JS | Phantom Embedded Next.js |
|---------|---------------------------|---------------|---------------------|--------------------------|
| Login methods | Google, Discord, Twitter, email | Wallet only (Phantom/Solflare) | Google, Apple | Google, Apple |
| Wallet type | Privy embedded (no extension) | External browser wallet | Phantom embedded | Phantom embedded |
| Framework | Next.js App Router | Next.js | Vite + vanilla JS | Next.js |
| Demo action | Sign message | Wallet auth + protected route | Balance display | Wallet auth |
| User identity | DID + linked social accounts | Wallet address only | OAuth profile | OAuth profile |
| UI library | shadcn/ui + Tailwind | shadcn/ui + Tailwind | CSS custom properties | N/A |
| Protected routes | Yes (client-side guard) | Yes (middleware) | No | No |
| usecase category | Auth | Auth | Starter | Starter |

**Positioning statement:** This is the first Privy-powered template in the Solana templates gallery. It demonstrates social login + embedded wallets (a pattern neither Supabase Auth nor Phantom templates cover), making it uniquely valuable for developers building consumer-facing dApps that need non-crypto-native onboarding.

## Sources

- [Solana Foundation Templates Repository](https://github.com/solana-foundation/templates) -- COMMUNITY_TEMPLATE_GUIDE.md requirements (HIGH confidence)
- [Solana Developer Templates Gallery](https://solana.com/developers/templates) -- Existing template inventory (HIGH confidence)
- [Privy React Setup Docs](https://docs.privy.io/basics/react/setup) -- PrivyProvider configuration (HIGH confidence)
- [Privy Solana Getting Started Recipe](https://docs.privy.io/recipes/solana/getting-started-with-privy-and-solana) -- Hooks and recommended patterns (HIGH confidence)
- [Privy Solana Wallet Creation Docs](https://docs.privy.io/guide/react/wallets/embedded/solana/creation) -- createOnLogin options (HIGH confidence)
- [Privy create-solana-next-app](https://github.com/privy-io/create-solana-next-app) -- Privy's own Next.js Solana starter, archived Jan 2026 (MEDIUM confidence -- archived)
- [Supabase Auth Template](https://solana.com/developers/templates/supabase-auth) -- Competitive analysis (HIGH confidence)
- [Phantom Embedded JS Template](https://solana.com/developers/templates/phantom-embedded-js) -- Competitive analysis (HIGH confidence)
- [Privy Stripe Acquisition (June 2025)](https://www.coindesk.com/business/2025/06/11/stripe-to-acquire-crypto-wallet-startup-privy-in-bid-to-expand-web3-capabilities) -- Context on Privy's future (MEDIUM confidence)
- [UseSolanaWalletsInterface Reference](https://docs.privy.io/reference/sdk/react-auth/interfaces/UseSolanaWalletsInterface) -- Hook API (HIGH confidence)
