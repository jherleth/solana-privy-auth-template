# Privy Auth Template

Social login + embedded Solana wallet powered by [Privy](https://docs.privy.io).

## Quick Start

```bash
npx create-solana-dapp --template privy-auth
cd privy-auth
cp .env.example .env.local
# Add your Privy App ID to .env.local
pnpm dev
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Create a Privy App

1. Go to [dashboard.privy.io](https://dashboard.privy.io) and create a new app
2. Navigate to **Settings > Basics** and copy your **App ID**
3. Under **Login Methods**, enable **Google**, **GitHub**, **Twitter**, and **Email**

### Configure Environment

```bash
cp .env.example .env.local
```

Open `.env.local` and replace the placeholder with your App ID:

```
NEXT_PUBLIC_PRIVY_APP_ID=your-actual-app-id
```

### Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Verify

Click **Login**, sign in with any enabled provider, and you should see the dashboard with your wallet address. If you see it, you're all set.

## How It Works

### Session Management

Privy manages authentication state client-side through the `usePrivy()` hook. The `ready` boolean indicates the Privy client has finished initializing, and `authenticated` indicates the user has an active session. This template uses client-side session state as the default.

For production apps, consider [cookie-based sessions](https://docs.privy.io/recipes/react/cookies) for SSR support and improved security.

```tsx
import { usePrivy } from '@privy-io/react-auth';

const { ready, authenticated, user } = usePrivy();
// ready:         Privy client has finished initializing
// authenticated: user has an active session
// user:          authenticated user object (or null)
```

### Protected Routes

The `AuthGuard` component wraps pages that require authentication. It checks `ready` and `authenticated` state, shows a loading skeleton during initialization, and redirects unauthenticated users to the home page. This is a client-side guard and the default approach in this template.

For production, consider [server-side middleware](https://docs.privy.io/guide/react/configuration/cookies) for route protection before the page loads.

```tsx
// components/auth/auth-guard.tsx (simplified)
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) router.replace('/');
  }, [ready, authenticated, router]);

  if (!ready) return <LoadingSkeleton />;
  if (!authenticated) return null;
  return <>{children}</>;
}
```

Wrap any page with `AuthGuard` to protect it:

```tsx
export default function DashboardPage() {
  return (
    <AuthGuard>
      <UserPanel />
      <WalletPanel />
      <ActionsPanel />
    </AuthGuard>
  );
}
```

### Embedded Wallet

Privy automatically creates a Solana embedded wallet on first login when configured with `createOnLogin: 'users-without-wallets'`. This means users get a wallet without any manual steps. If auto-creation doesn't trigger, the `WalletPanel` displays a **Create Wallet** button as a manual fallback using the `useCreateWallet` hook.

The three `createOnLogin` options are `'all-users'`, `'users-without-wallets'`, and `'off'`. See the [embedded wallet docs](https://docs.privy.io/guide/react/wallets/embedded/solana/creation) for details.

```tsx
// components/providers/privy-provider.tsx (config excerpt)
<PrivyProvider
  appId={PRIVY_APP_ID}
  config={{
    loginMethods: ['google', 'github', 'twitter', 'email'],
    embeddedWallets: {
      solana: {
        createOnLogin: 'users-without-wallets',
      },
    },
  }}
>
```

## Project Structure

```
.
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Landing page with login CTA
│   ├── dashboard/page.tsx      # User profile, wallet, actions
│   └── protected/page.tsx      # Auth-guarded demo route
├── components/
│   ├── auth/
│   │   ├── auth-guard.tsx      # Client-side route protection
│   │   ├── auth-status.tsx     # Header auth badge
│   │   ├── login-button.tsx    # Privy login trigger
│   │   └── logout-button.tsx   # Privy logout trigger
│   ├── dashboard/
│   │   ├── actions-panel.tsx   # Message signing demo
│   │   ├── user-panel.tsx      # Profile + linked accounts
│   │   └── wallet-panel.tsx    # Wallet address + create
│   ├── providers/
│   │   ├── privy-provider.tsx  # Privy config + env guard
│   │   └── theme-provider.tsx  # Dark/light theme
│   └── header.tsx              # Nav + auth status
├── types/privy.ts              # PrivyUserSummary, WalletSummary, SessionInfo
├── .env.example                # Environment variable template
├── og-image.png                # 1200x630 gallery image
└── package.json
```

## Not Included

- **No mainnet support** -- devnet only, this is a demo template
- **No external wallet connections** -- no Phantom or Solflare; this demonstrates Privy embedded wallets
- **No token transfers or SPL interactions** -- message signing is the canonical wallet demo
- **No cookie-based SSR sessions** -- documented above as a production best practice, not implemented
- **No middleware route protection** -- documented above as a production option, not implemented

## Resources

- [Privy Solana Getting Started](https://docs.privy.io/recipes/solana/getting-started-with-privy-and-solana)
- [Privy React Quickstart](https://docs.privy.io/basics/react/quickstart)
- [Privy Cookie Sessions](https://docs.privy.io/recipes/react/cookies)
- [Privy Embedded Wallets (Solana)](https://docs.privy.io/guide/react/wallets/embedded/solana/creation)
- [Privy Dashboard](https://dashboard.privy.io)

## License

MIT
