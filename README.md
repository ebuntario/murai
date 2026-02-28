# Token Wallet

**Payment-gateway-agnostic token wallet for AI/SaaS applications.**

Add credit-based billing to any app in under 30 minutes — with first-class support for Indonesian payment gateways.

[![CI](https://github.com/user/token-wallet/actions/workflows/ci.yml/badge.svg)](https://github.com/user/token-wallet/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Why Token Wallet?

Building token/credit billing from scratch means solving atomic balance updates, idempotent webhooks, double-charge prevention, and payment gateway integration — before writing a single line of product code.

Token Wallet handles all of that so you can focus on your product:

- **Atomic balance operations** — no overdrafts, no double-charges, ever
- **Append-only ledger** — every transaction is permanently recorded and auditable
- **Idempotent webhooks** — safe under retry storms from any gateway
- **Gateway-agnostic** — swap Midtrans for Xendit (or both) without changing your wallet code
- **Transaction history** — paginated queries with type and status filtering
- **Timing-safe verification** — `crypto.timingSafeEqual` on all webhook signatures

## Supported Gateways

| Gateway | Status | Payment Methods |
|---|---|---|
| **Midtrans Snap** | Stable | GoPay, ShopeePay, QRIS, bank transfer, credit card |
| **Xendit Checkout** | Stable | OVO, DANA, ShopeePay, QRIS, virtual accounts |
| **Stripe** | [Planned (v0.4)](./ROADMAP.md) | Global card payments |

Custom gateways can be added by implementing the `PaymentGatewayAdapter` interface.

## Quick Start

### Install

```bash
npm install token-wallet drizzle-orm postgres
# or
pnpm add token-wallet drizzle-orm postgres
```

### Create the database tables

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

### Wire it up

```typescript
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import {
  createWallet,
  createCheckoutManager,
  createLedger,
  createDrizzleStorage,
  createMidtransGateway,
} from 'token-wallet';

// 1. Storage
const sql = postgres(process.env.DATABASE_URL);
const storage = createDrizzleStorage(drizzle(sql));

// 2. Gateway
const gateway = createMidtransGateway({
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
  sandbox: true,
});

// 3. Wallet + Checkout
const wallet = createWallet({ storage });
const ledger = createLedger(storage);
const checkout = createCheckoutManager(gateway, ledger, storage);
```

### Top up via payment gateway

```typescript
const session = await checkout.createSession({
  userId: 'user_123',
  amount: 100_000, // IDR 100,000
  successRedirectUrl: 'https://yourapp.com/success',
  failureRedirectUrl: 'https://yourapp.com/fail',
});
// Redirect user to session.redirectUrl
```

### Handle webhooks

```typescript
// In your webhook endpoint
const result = await checkout.handleWebhook({
  payload: req.body,
  signature: req.headers['x-callback-token'], // Xendit
  // or: signature: req.body.signature_key,    // Midtrans
});
// result.action: 'credited' | 'skipped' | 'duplicate'
```

### Spend tokens

```typescript
if (await wallet.canSpend('user_123', 5_000)) {
  await wallet.spend('user_123', 5_000, 'usage-unique-key');
}
```

### Query history

```typescript
const transactions = await wallet.getTransactions('user_123', {
  limit: 20,
  type: 'debit',
});

const checkouts = await wallet.getCheckouts('user_123', {
  status: 'paid',
});
```

## Packages

| Package | Description |
|---|---|
| [`token-wallet`](./packages/token-wallet) | Meta-package — single install, re-exports everything |
| [`@token-wallet/core`](./packages/core) | Wallet, ledger, checkout manager, types, errors |
| [`@token-wallet/gateway-midtrans`](./packages/gateway-midtrans) | Midtrans Snap adapter |
| [`@token-wallet/gateway-xendit`](./packages/gateway-xendit) | Xendit Checkout adapter |
| [`@token-wallet/storage-drizzle`](./packages/storage-drizzle) | Drizzle ORM storage (PostgreSQL) |

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Your App   │────▶│    Wallet    │────▶│  Ledger (core)   │
│              │     │   (core)     │     │  append-only log │
└──────────────┘     └──────────────┘     └──────────────────┘
                            │                      │
                     ┌──────┴──────┐        ┌──────┴──────┐
                     │  Checkout   │        │   Storage   │
                     │  Manager    │        │   Adapter   │
                     └──────┬──────┘        └──────┬──────┘
                            │                      │
                     ┌──────┴──────┐        ┌──────┴──────┐
                     │   Gateway   │        │   Drizzle   │
                     │   Adapter   │        │ PostgreSQL  │
                     └─────────────┘        └─────────────┘
                     Midtrans │ Xendit
```

**Key invariants:**
- Ledger entries are append-only — never updated or deleted
- Balance reads during writes use `SELECT FOR UPDATE` (row-level locking)
- All webhook credits use idempotency keys derived from the order ID

## API Reference

| Function | Returns |
|---|---|
| `createWallet({ storage })` | `{ getBalance, canSpend, spend, topUp, getTransactions, getCheckouts }` |
| `createLedger(storage)` | `{ credit, debit, getBalance, getTransactions }` |
| `createCheckoutManager(gateway, ledger, storage)` | `{ createSession, handleWebhook }` |
| `createDrizzleStorage(db)` | `StorageAdapter` implementation |
| `createMidtransGateway(config)` | `PaymentGatewayAdapter` with `getPaymentStatus` |
| `createXenditGateway(config)` | `PaymentGatewayAdapter` with `getPaymentStatus` |

## Development

```bash
pnpm install        # Install dependencies
pnpm build          # Build all packages
pnpm test           # Run all tests
pnpm typecheck      # Type-check
pnpm lint           # Biome lint + format check
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full development guide.

## Security

Webhook verification uses `crypto.timingSafeEqual` to prevent timing attacks. See [SECURITY.md](./SECURITY.md) for our disclosure process.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features (Stripe gateway, token expiration, example apps).

## License

[MIT](./LICENSE)
