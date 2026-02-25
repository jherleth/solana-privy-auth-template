# Domain Pitfalls

**Domain:** Privy + Solana dApp template (community submission for create-solana-dapp)
**Researched:** 2026-02-24

---

## Critical Pitfalls

Mistakes that cause rewrites, broken demos, or template rejection.

---

### Pitfall 1: Using Privy v2 APIs That Were Removed in v3

**What goes wrong:** The template uses `useSolanaWallets`, `useSendTransaction`, `ConnectedSolanaWallet`, or `embeddedWallets.createOnLogin` in the PrivyProvider config -- all of which were removed or renamed in Privy v3.0.0. The template compiles on an older SDK but breaks on the current version, or reviewers reject it as outdated.

**Why it happens:** Most tutorials, blog posts, and even Privy's own archived `create-solana-next-app` (archived January 2026) use v2 APIs. Training data and search results overwhelmingly reference the old API surface. The v3 migration was substantial -- `useSolanaWallets` became `useWallets` (from `@privy-io/react-auth/solana`), `ConnectedSolanaWallet` became `ConnectedStandardSolanaWallet`, `useSendTransaction` became `useSignAndSendTransaction`, and `createOnLogin` moved from PrivyProvider config to dashboard-only configuration.

**Consequences:** Build errors, runtime crashes, or silent failures. If the template ships with v2 code and v3 dependencies, it simply will not work. If it pins to v2, it ships on a deprecated SDK.

**Prevention:**
- Pin to `@privy-io/react-auth` v3.x (latest stable).
- Import Solana hooks from `@privy-io/react-auth/solana`, not the root package.
- Use `useWallets` (not `useSolanaWallets`), `useStandardSignTransaction` (not the old `signTransaction` pattern), and `ConnectedStandardSolanaWallet`.
- Consult the [Privy v3 changelog](https://docs.privy.io/reference/sdk/react-auth/changelog) and [v2-to-v3 migration guide](https://docs.privy.io/basics/react/advanced/migrating-to-2.0) before writing any hook code.
- Verify every import path and hook name against current docs before use.

**Detection:** `npm install` succeeds but hooks throw at runtime; TypeScript errors referencing unknown exports from `@privy-io/react-auth`.

**Phase:** Must be addressed in Phase 1 (project scaffolding / dependency installation). Wrong SDK version contaminates everything downstream.

**Confidence:** HIGH -- verified via [official Privy changelog](https://docs.privy.io/reference/sdk/react-auth/changelog) and [Privy X announcement](https://x.com/privy_io/status/1969058996725178635).

---

### Pitfall 2: Auth State Flicker on Page Load

**What goes wrong:** The UI briefly flashes "unauthenticated" content (login button, redirect to landing page) before Privy finishes initializing, then snaps to the authenticated state. On protected routes, users see a flash of the landing page before being redirected back to the dashboard.

**Why it happens:** The `PrivyProvider` initializes asynchronously. During initialization, `usePrivy()` returns `ready: false` and `authenticated: false`. If components render UI based on `authenticated` without first gating on `ready`, they render the unauthenticated path for one or more frames before the SDK settles.

**Consequences:** Unprofessional UX that undermines the template's value as a showcase. For a Solana Foundation community template, this is a credibility killer -- it signals the author does not understand Privy's initialization model.

**Prevention:**
- **Always** gate on `ready` before branching on `authenticated`:
  ```tsx
  const { ready, authenticated } = usePrivy();
  if (!ready) return null; // or a loading skeleton
  if (!authenticated) return <LoginPrompt />;
  return <Dashboard />;
  ```
- Create a dedicated `AuthGuard` or `AuthStatus` component that encapsulates this pattern so every route uses it consistently.
- Never render auth-dependent content while `ready === false`.
- For protected routes: the client-side guard must check `ready` first, show nothing (or a spinner) until ready, then redirect if not authenticated.

**Detection:** Load any authenticated page with DevTools throttled to "Slow 3G". If you see the unauthenticated UI flash before the authenticated UI, the flicker bug is present.

**Phase:** Phase 1 (core auth components). The `AuthGuard` pattern must be established before any page is built.

**Confidence:** HIGH -- documented in [Privy auth state docs](https://docs.privy.io/authentication/user-authentication/authentication-state) and [usePrivy reference](https://docs.privy.io/reference/sdk/react-auth/functions/usePrivy).

---

### Pitfall 3: Wallet Ready vs Auth Ready Confusion

**What goes wrong:** Code assumes that once `usePrivy().ready === true`, wallets are available. It is not. `useWallets()` from `@privy-io/react-auth/solana` has its own independent `ready` boolean. Attempting to access wallets before `useWallets().ready === true` returns an empty array, causing "no wallet found" errors or blank wallet panels.

**Why it happens:** There are two distinct readiness domains:
1. **Auth readiness** (`usePrivy().ready`) -- Privy SDK initialized, auth state determined.
2. **Wallet readiness** (`useWallets().ready` from `@privy-io/react-auth/solana`) -- wallet connections resolved (EIP-6963 discovery, iframe loaded for embedded wallets, WalletConnect sessions).

Developers conflate these because both come from Privy and both have a `ready` flag. Auth can be ready while wallets are still loading.

**Consequences:** Wallet panel shows "No wallet found" momentarily. "Sign message" action throws because the wallet reference is null. If the code has no null guard, it crashes the app.

**Prevention:**
- Track both readiness states independently:
  ```tsx
  const { ready: authReady, authenticated } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets(); // from @privy-io/react-auth/solana

  if (!authReady || !walletsReady) return <Loading />;
  ```
- The Wallet panel component should show a loading state until `walletsReady === true`.
- The "Sign a message" action should be disabled (not hidden) until a wallet is confirmed available.
- Create TypeScript types that make the two readiness states explicit in your component props/state.

**Detection:** Add `console.log({ authReady, walletsReady, walletCount: wallets.length })` in dashboard component. If `authReady` is true but `walletsReady` is false (or wallets is empty) for any period, the gap exists.

**Phase:** Phase 2 (dashboard / wallet panel). Must be addressed when building the wallet display and signing components.

**Confidence:** HIGH -- documented in [Privy useWallets docs](https://docs.privy.io/guide/react/wallets/use-wallets) and [Solana getting started recipe](https://docs.privy.io/recipes/solana/getting-started-with-privy-and-solana).

---

### Pitfall 4: Missing webpack externals for @solana/kit Packages

**What goes wrong:** Next.js build fails or produces runtime errors because `@solana/kit`, `@solana-program/memo`, `@solana-program/system`, and `@solana-program/token` are not configured as webpack externals in `next.config.ts`. Errors include module resolution failures, "Can't resolve" errors, or SSR crashes from Node.js-incompatible code paths.

**Why it happens:** These Solana packages use Node.js native modules or WASM that webpack cannot bundle for the browser. Privy's Solana recipe explicitly requires marking them as `commonjs` externals, but this is easy to miss because it is a Privy-specific requirement (not a general Next.js pattern) and the error messages do not point to the solution.

**Consequences:** Build fails entirely, or the app crashes at runtime with cryptic errors about missing modules. This is a hard blocker -- the template literally cannot run.

**Prevention:**
- Add to `next.config.ts`:
  ```ts
  webpack: (config) => {
    config.externals['@solana/kit'] = 'commonjs @solana/kit';
    config.externals['@solana-program/memo'] = 'commonjs @solana-program/memo';
    config.externals['@solana-program/system'] = 'commonjs @solana-program/system';
    config.externals['@solana-program/token'] = 'commonjs @solana-program/token';
    return config;
  }
  ```
- Test the build (`next build`) in CI-like conditions (clean install, no cached modules) before submitting.
- Document this requirement in the template README so developers who modify the template understand why the config exists.

**Detection:** Run `pnpm build` on a clean checkout. If it fails with module resolution errors mentioning `@solana/kit` or `@solana-program/*`, the externals are missing.

**Phase:** Phase 1 (project scaffolding / next.config.ts setup). Must be in place before any Solana code is written.

**Confidence:** HIGH -- documented in [Privy Solana getting started recipe](https://docs.privy.io/recipes/solana/getting-started-with-privy-and-solana).

---

### Pitfall 5: PrivyProvider Not Wrapped in "use client" Component

**What goes wrong:** The `PrivyProvider` is placed directly in `app/layout.tsx` (a Server Component by default) without a `"use client"` wrapper component. This causes a build error or hydration crash because `PrivyProvider` contains client-only elements (dialogs, iframes) that cannot render on the server.

**Why it happens:** Next.js App Router defaults to Server Components. New developers put all providers in `layout.tsx` and forget that third-party context providers must be wrapped in a Client Component. The error message ("createContext only works in Client Components") is clear, but the fix pattern (separate `providers.tsx` file with `"use client"`) is not obvious to someone unfamiliar with App Router conventions.

**Consequences:** Build fails or hydration error on every page load. Complete blocker.

**Prevention:**
- Create `components/providers.tsx` (or `app/providers.tsx`) with `"use client"` as the first line.
- Export a `Providers` component that wraps children with `PrivyProvider`.
- Import `Providers` in `app/layout.tsx` and wrap `{children}`.
- This is the exact pattern documented in [Privy's Next.js troubleshooting guide](https://docs.privy.io/guide/react/troubleshooting/frameworks/nextjs).

**Detection:** If `PrivyProvider` appears in any file without `"use client"` at the top (or without being inside a Client Component ancestor), the bug is present.

**Phase:** Phase 1 (project scaffolding / layout setup). This is literally the first thing you configure.

**Confidence:** HIGH -- documented in [Privy setup docs](https://docs.privy.io/basics/react/setup) and [Next.js troubleshooting](https://docs.privy.io/guide/react/troubleshooting/frameworks/nextjs).

---

### Pitfall 6: Template Submission Metadata Missing or Malformed

**What goes wrong:** The PR to solana-foundation/templates is rejected because `package.json` is missing required fields (`displayName`, `usecase`, `description`) or `og-image.png` is missing/wrong dimensions.

**Why it happens:** The metadata requirements are specific to the `create-solana-dapp` template system and are not part of standard npm package.json conventions. The `usecase` field must be one of a fixed set of values (Starter, Payments, Airdrop, DeFi, NFT, Gaming). The `og-image.png` must be exactly 1200x630 pixels, PNG format, under 500KB. These are validated by `pnpm lint` in the templates repo.

**Consequences:** PR rejected. Wasted review cycle. For a bounty submission, delays could mean missing deadlines.

**Prevention:**
- Add to `package.json`:
  ```json
  {
    "displayName": "Privy Auth",
    "description": "Privy social login with Solana embedded wallets",
    "usecase": "Starter",
    "keywords": ["privy", "solana", "auth", "embedded-wallet", "next.js"]
  }
  ```
- Create `og-image.png` at exactly 1200x630px, PNG, under 500KB.
- Clone the templates repo locally, place template in `community/privy-auth/`, run `pnpm generate` and `pnpm lint` to validate before submitting.
- Reference existing community templates for exact metadata format.

**Detection:** Run `pnpm lint` in the templates repo after placing your template. Any metadata errors will be flagged.

**Phase:** Phase 3 (template packaging / submission prep). Must be validated before PR submission.

**Confidence:** HIGH -- documented in [Community Template Contributor Guide](https://github.com/solana-foundation/templates/blob/main/COMMUNITY_TEMPLATE_GUIDE.md) and verified via the [templates repo](https://github.com/solana-foundation/templates).

---

## Moderate Pitfalls

---

### Pitfall 7: createOnLogin Not Working with Whitelabel Login

**What goes wrong:** Embedded Solana wallet is configured to auto-create on login via `embeddedWallets.solana.createOnLogin: 'all-users'` in the PrivyProvider config, but wallets are never created. Users log in successfully but have no embedded wallet.

**Why it happens:** In Privy v3, `createOnLogin` was removed from the PrivyProvider config and moved to dashboard-only configuration. Even in v2, automatic wallet creation only works through the Privy modal login flow -- it does not trigger for whitelabel login methods like `loginWithCode`, `useLoginWithOAuth`, or custom auth flows. If the template uses any whitelabel login approach, automatic creation silently fails.

**Prevention:**
- Configure automatic wallet creation in the Privy Dashboard, not in code (v3 requirement).
- If using whitelabel login: use the `useCreateWallet` hook to manually create embedded wallets after login succeeds:
  ```tsx
  const { createWallet } = useCreateWallet();
  // After successful login:
  await createWallet({ type: 'solana' });
  ```
- Test the full login-to-wallet-creation flow end-to-end. Do not assume "configured = working."
- Document in README which login method triggers wallet creation and which does not.

**Detection:** Log in with each configured method. Check if an embedded wallet appears in the wallet panel. If it does not, automatic creation is not firing.

**Phase:** Phase 2 (auth flow / wallet creation). Must be validated when implementing the login flow.

**Confidence:** HIGH -- documented in [Privy automatic wallet creation docs](https://docs.privy.io/basics/react/advanced/automatic-wallet-creation) and [Solana wallet creation docs](https://docs.privy.io/guide/react/wallets/embedded/solana/creation).

---

### Pitfall 8: Message Encoding Errors in signMessage

**What goes wrong:** The "Sign a message" demo action fails because the message is passed as a raw string instead of a `Uint8Array`, or a `Uint8Array` is passed without base64-encoding it first. The signing call either throws an error or produces an invalid signature.

**Why it happens:** Privy's signing API has specific encoding requirements:
- If passing a string, pass it directly (the SDK encodes internally).
- If passing bytes (`Uint8Array`), you must base64-encode the array as a string first.

Most Solana message signing examples outside Privy use `new TextEncoder().encode(message)` to get a `Uint8Array` and pass that directly. With Privy, this pattern requires the additional base64 encoding step, which catches developers off guard.

**Prevention:**
- For simple string messages (which is what a template demo should use), pass the string directly:
  ```tsx
  const { signMessage } = useSignMessage();
  const signature = await signMessage({ message: 'Hello from Privy!', wallet });
  ```
- If you must use bytes, base64-encode:
  ```tsx
  const bytes = new TextEncoder().encode('Hello');
  const base64 = btoa(String.fromCharCode(...bytes));
  const signature = await signMessage({ message: base64, wallet });
  ```
- For a template demo, always use the string path. It is simpler and avoids encoding bugs.

**Detection:** If `signMessage` throws with an encoding-related error, or the returned signature fails to verify, the encoding is wrong.

**Phase:** Phase 2 (actions panel / sign message demo).

**Confidence:** HIGH -- documented in [Privy Solana getting started recipe](https://docs.privy.io/recipes/solana/getting-started-with-privy-and-solana) and [Solana wallet usage docs](https://docs.privy.io/guide/expo/embedded/solana/usage).

---

### Pitfall 9: Mixing @solana/web3.js and @solana/kit

**What goes wrong:** The template imports types or utilities from both `@solana/web3.js` (legacy) and `@solana/kit` (modern). This causes conflicting type definitions (e.g., two different `Transaction` types), bundle bloat from shipping both libraries, and confusion about which API to use for what.

**Why it happens:** Privy's v3 SDK modernized away from `@solana/web3.js` types, but many Solana ecosystem examples, Stack Overflow answers, and even some Privy docs still reference web3.js patterns. Developers copy-paste from multiple sources and end up with both libraries installed.

**Prevention:**
- Choose one library and stick with it. For a new template in 2026, use `@solana/kit` -- it is the modern Solana SDK, Privy v3 is built for it, and the Solana Foundation's newer "gill" templates use it.
- Do not install `@solana/web3.js` at all. If a dependency pulls it in transitively, audit and verify it does not conflict.
- Import transaction-building utilities exclusively from `@solana/kit` and `@solana-program/*`.
- If you need legacy compatibility for any reason, use `@solana/web3-compat` as a bridge -- but for a template, avoid this complexity entirely.

**Detection:** Check `package.json` for both `@solana/web3.js` and `@solana/kit`. If both are present, investigate and remove one.

**Phase:** Phase 1 (dependency installation). Decide once and enforce consistently.

**Confidence:** MEDIUM -- based on [Privy @solana/kit integration docs](https://docs.privy.io/wallets/connectors/solana/kit-integrations) and the [Privy modernization announcement](https://x.com/privy_io/status/1969058996725178635). The ecosystem is mid-transition, so both libraries are still commonly seen.

---

### Pitfall 10: Not Testing with `pnpm create solana-dapp --template`

**What goes wrong:** The template works perfectly in development from the git repo, but fails when scaffolded via the `create-solana-dapp` CLI. Post-install scripts do not run, dependencies are not resolved, or paths break because the template structure does not match what the CLI expects.

**Why it happens:** The CLI clones the template from a specific path in the templates repo (`community/privy-auth/`), applies `{{name}}` substitutions, and runs post-install instructions. If the template's `package.json` does not include the `create-solana-dapp` configuration block, or if paths assume the template is at repo root instead of nested in the templates monorepo, the scaffolding breaks.

**Prevention:**
- Clone the [templates repo](https://github.com/solana-foundation/templates) and place your template in `community/privy-auth/`.
- Run `pnpm generate` to register it.
- Test the full CLI flow: `pnpm create solana-dapp --template gh:solana-foundation/templates/community/privy-auth my-test-app`.
- Verify the scaffolded app installs, builds, and runs without modification (except adding the Privy App ID).
- Add a `create-solana-dapp` field in `package.json` with post-install instructions for setting the `NEXT_PUBLIC_PRIVY_APP_ID` env var.

**Detection:** Scaffold the template via CLI into a fresh directory. If `npm install` or `npm run dev` fails, the template structure or metadata is wrong.

**Phase:** Phase 3 (template packaging / submission prep).

**Confidence:** MEDIUM -- based on [templates repo documentation](https://github.com/solana-foundation/templates) and [Community Template Contributor Guide](https://github.com/solana-foundation/templates/blob/main/COMMUNITY_TEMPLATE_GUIDE.md). Cannot fully verify without testing against the live CLI.

---

### Pitfall 11: Hardcoded or Missing Environment Variables

**What goes wrong:** The template either hardcodes a Privy App ID (security issue, will not work for other developers) or references `process.env.NEXT_PUBLIC_PRIVY_APP_ID` without providing a `.env.example` file, leaving developers confused about what configuration is needed.

**Why it happens:** During development, developers set their own App ID and forget to sanitize before submission. Or they omit the `.env.example` file because they assume the README is sufficient.

**Prevention:**
- Never commit a real Privy App ID. Use a placeholder like `your-privy-app-id-here` in `.env.example`.
- Create `.env.example` with all required variables and comments:
  ```env
  # Get your Privy App ID from https://dashboard.privy.io
  NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id-here
  ```
- Add `.env` and `.env.local` to `.gitignore`.
- The PrivyProvider should read from `process.env.NEXT_PUBLIC_PRIVY_APP_ID` and fail gracefully (with a clear error message) if the value is missing or is the placeholder.
- The README must include step-by-step Privy Dashboard setup instructions.

**Detection:** Search the codebase for any string that looks like a real Privy App ID (typically `clXXXXXXXXX` format). Check that `.env.example` exists and `.env` is gitignored.

**Phase:** Phase 1 (project scaffolding) and Phase 3 (submission prep).

**Confidence:** HIGH -- this is a universal template best practice reinforced by the [template rejection criteria](https://github.com/solana-foundation/templates/blob/main/COMMUNITY_TEMPLATE_GUIDE.md) ("no personal configuration, API keys, or credentials").

---

## Minor Pitfalls

---

### Pitfall 12: Linked Wallets vs Connected Wallets Confusion

**What goes wrong:** The wallet panel displays wallets from `usePrivy().user.linkedAccounts` (linked wallets) instead of `useWallets()` from `@privy-io/react-auth/solana` (connected wallets). Linked wallets may include wallets that are not currently connected, so signing operations fail for wallets shown in the UI.

**Prevention:**
- Use `useWallets()` from `@privy-io/react-auth/solana` for the wallet display panel and all signing operations. These are actively connected and ready for transactions.
- Use `usePrivy().user.linkedAccounts` only for showing which accounts are linked to the user's Privy profile (informational, not actionable).
- Document this distinction in code comments.

**Phase:** Phase 2 (wallet panel component).

**Confidence:** HIGH -- documented in [Privy useWallets docs](https://docs.privy.io/guide/react/wallets/use-wallets).

---

### Pitfall 13: Solana RPC Configuration Omitted for Embedded Wallet UIs

**What goes wrong:** Embedded wallet transaction UIs (built-in send/receive dialogs) fail because Solana RPC endpoints are not configured in the PrivyProvider. The wallet appears to work for message signing but fails for any transaction-related UI.

**Prevention:**
- If using Privy's embedded wallet UIs for transactions, configure `config.solana.rpcs` in the PrivyProvider:
  ```tsx
  config={{
    solana: {
      rpcs: {
        'solana:devnet': {
          rpc: createSolanaRpc('https://api.devnet.solana.com'),
          rpcSubscriptions: createSolanaRpcSubscriptions('wss://api.devnet.solana.com')
        }
      }
    }
  }}
  ```
- For a template that only demos message signing (not transactions), this config can be omitted but should be documented in the README as needed for transaction support.

**Phase:** Phase 1 (PrivyProvider configuration) or documented as an extension in the README.

**Confidence:** HIGH -- documented in [Privy Solana getting started recipe](https://docs.privy.io/recipes/solana/getting-started-with-privy-and-solana).

---

### Pitfall 14: og-image.png Dimensions or Size Wrong

**What goes wrong:** The `pnpm lint` check in the templates repo fails because `og-image.png` is not exactly 1200x630 pixels, exceeds 500KB, or is not PNG format.

**Prevention:**
- Create the image at exactly 1200x630px.
- Export as PNG.
- Compress to under 500KB (use a tool like `pngquant` or `tinypng`).
- Name it exactly `og-image.png` (lowercase).
- Validate dimensions before submitting: `identify og-image.png` (ImageMagick) or check in any image editor.

**Phase:** Phase 3 (template packaging).

**Confidence:** HIGH -- documented in [Community Template Contributor Guide](https://github.com/solana-foundation/templates/blob/main/COMMUNITY_TEMPLATE_GUIDE.md).

---

### Pitfall 15: Not Following Conventional Commits for the Templates Repo PR

**What goes wrong:** The PR to the templates repo is flagged or delayed because commit messages do not follow the Conventional Commits specification required by the project.

**Prevention:**
- Use `feat: add privy-auth community template` as the commit message format.
- Follow the [Conventional Commits spec](https://www.conventionalcommits.org/) for any additional commits.
- Branch naming: `username/feat-privy-auth-template`.

**Phase:** Phase 3 (submission).

**Confidence:** HIGH -- documented in [CONTRIBUTING.md](https://github.com/solana-foundation/templates/blob/main/CONTRIBUTING.md).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Project scaffolding (Phase 1) | Wrong Privy SDK version (v2 vs v3) | Pin to v3.x, verify all imports against current docs |
| Project scaffolding (Phase 1) | Missing webpack externals | Add @solana/kit and @solana-program/* externals to next.config.ts immediately |
| Project scaffolding (Phase 1) | PrivyProvider in Server Component | Create dedicated "use client" providers.tsx wrapper |
| Auth components (Phase 1-2) | Auth state flicker | Gate all auth-dependent UI on `ready` before `authenticated` |
| Wallet panel (Phase 2) | Wallet ready vs auth ready confusion | Track `usePrivy().ready` and `useWallets().ready` independently |
| Wallet creation (Phase 2) | createOnLogin silently fails | Configure in Dashboard (v3), test end-to-end, fallback to useCreateWallet |
| Sign message demo (Phase 2) | Encoding errors | Use string messages directly; avoid unnecessary Uint8Array conversion |
| Template packaging (Phase 3) | Missing metadata fields | Validate with `pnpm lint` in templates repo before PR |
| Template packaging (Phase 3) | og-image.png wrong spec | Exactly 1200x630px PNG under 500KB |
| CLI testing (Phase 3) | Template works in dev but fails via CLI | Test the full `create-solana-dapp --template` flow |
| Submission (Phase 3) | API keys committed, non-conventional commits | .env.example with placeholder, conventional commit messages |

---

## Sources

### Official Documentation (HIGH confidence)
- [Privy + Solana Getting Started Recipe](https://docs.privy.io/recipes/solana/getting-started-with-privy-and-solana)
- [Privy React SDK Setup](https://docs.privy.io/basics/react/setup)
- [Privy Next.js Troubleshooting](https://docs.privy.io/guide/react/troubleshooting/frameworks/nextjs)
- [Privy Authentication State](https://docs.privy.io/authentication/user-authentication/authentication-state)
- [Privy usePrivy Reference](https://docs.privy.io/reference/sdk/react-auth/functions/usePrivy)
- [Privy useWallets / Getting Connected Wallets](https://docs.privy.io/guide/react/wallets/use-wallets)
- [Privy Automatic Wallet Creation](https://docs.privy.io/basics/react/advanced/automatic-wallet-creation)
- [Privy Solana Wallet Creation](https://docs.privy.io/guide/react/wallets/embedded/solana/creation)
- [Privy @solana/kit Integration](https://docs.privy.io/wallets/connectors/solana/kit-integrations)
- [Privy React Auth Changelog](https://docs.privy.io/reference/sdk/react-auth/changelog)
- [Solana Foundation Templates Repo](https://github.com/solana-foundation/templates)
- [Community Template Contributor Guide](https://github.com/solana-foundation/templates/blob/main/COMMUNITY_TEMPLATE_GUIDE.md)
- [Templates Repo CONTRIBUTING.md](https://github.com/solana-foundation/templates/blob/main/CONTRIBUTING.md)

### Official Examples (MEDIUM confidence -- archived)
- [Privy create-solana-next-app (archived Jan 2026)](https://github.com/privy-io/create-solana-next-app)

### Ecosystem / Community (MEDIUM confidence)
- [Privy Solana Modernization Announcement](https://x.com/privy_io/status/1969058996725178635)
- [Next.js Hydration Error Docs](https://nextjs.org/docs/messages/react-hydration-error)
- [Crossmint/Privy Solana Quickstart](https://github.com/Crossmint/solana-wallets-privy-quickstart)
