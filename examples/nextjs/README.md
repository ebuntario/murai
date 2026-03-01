# Token Wallet — Next.js Example

A working example of [token-wallet](https://github.com/user/token-wallet) integrated with Next.js 15 App Router and Midtrans Snap.

## What's included

- **Dashboard** — balance display, top-up buttons, spend buttons, transaction history
- **Server Action** — top-up via Midtrans Snap redirect
- **Route Handler** — webhook endpoint for Midtrans payment notifications
- **Spend action** — token deduction with error handling

## Prerequisites

- Node.js 22+
- PostgreSQL database ([Neon free tier](https://neon.tech) recommended)
- [Midtrans Sandbox](https://dashboard.sandbox.midtrans.com) account

## Setup

1. **Clone and install:**

```bash
cd examples/nextjs
pnpm install
```

1. **Create `.env.local`** (copy from `.env.example`):

```bash
DATABASE_URL=postgres://user:pass@host/dbname
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

1. **Create database tables:**

```sql
CREATE TABLE wallets (
  user_id TEXT PRIMARY KEY,
  balance BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount BIGINT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE checkouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount BIGINT NOT NULL,
  redirect_url TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

1. **Run:**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing webhooks locally

Use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
```

Then set the webhook URL in Midtrans Dashboard:
**Settings → Payment → Notification URL** → `https://your-id.ngrok.io/api/webhooks/midtrans`

## Architecture

```text
src/
├── app/
│   ├── layout.tsx              # Root layout with Tailwind
│   ├── page.tsx                # Dashboard (Server Component)
│   ├── actions.ts              # Server Actions (top-up + spend)
│   ├── api/webhooks/midtrans/
│   │   └── route.ts            # Webhook Route Handler
│   └── success/page.tsx        # Post-payment redirect
├── lib/
│   └── wallet.ts               # Wallet singleton setup
└── components/
    ├── balance-display.tsx      # Balance card (Server Component)
    ├── topup-button.tsx         # Top-up form (Server Component)
    └── spend-button.tsx         # Spend form (Client Component)
```
