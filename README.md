# Murai

**Payment-gateway-agnostic token wallet for AI/SaaS applications.**

Add credit-based billing to any app in under 30 minutes — with first-class support for Indonesian payment gateways.

[![CI](https://github.com/ebuntario/murai/actions/workflows/ci.yml/badge.svg)](https://github.com/ebuntario/murai/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/murai.svg)](https://www.npmjs.com/package/murai)
[![npm downloads](https://img.shields.io/npm/dm/murai.svg)](https://www.npmjs.com/package/murai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Why the Name?

**Murai** is named after the [Murai Batu](https://en.wikipedia.org/wiki/White-rumped_shama) (*Copsychus malabaricus*), Indonesia's most prized songbird — famous across the archipelago for its melodic voice and spirited character. The name signals this project's Indonesian origin and its first-class support for Indonesian payment gateways like Midtrans and Xendit. Just as the Murai Batu is a champion among songbirds, Murai aims to be the go-to token wallet for Indonesian SaaS and AI applications.

## Why Murai?

Building token/credit billing from scratch means solving atomic balance updates, idempotent webhooks, double-charge prevention, and payment gateway integration — before writing a single line of product code.

Murai handles all of that so you can focus on your product:

- **Atomic balance operations** — no overdrafts, no double-charges, ever
- **Append-only ledger** — every transaction is permanently recorded and auditable
- **Idempotent webhooks** — safe under retry storms from any gateway
- **Gateway-agnostic** — Midtrans, Xendit, and Stripe built-in; add your own with a simple interface
- **Token expiration** — FIFO bucket-based credit expiration with `expireTokens()` cron job
- **Usage reporting** — track provider cost metadata and generate usage reports
- **Transaction history** — paginated queries with type, status, and date filtering
- **Timing-safe verification** — `crypto.timingSafeEqual` on all webhook signatures

## Supported Gateways

| Gateway | Status | Payment Methods |
| --- | --- | --- |
| **Midtrans Snap** | Stable | GoPay, ShopeePay, QRIS, bank transfer, credit card |
| **Xendit Checkout** | Stable | OVO, DANA, ShopeePay, QRIS, virtual accounts |
| **Stripe Checkout** | Stable | Global card payments, Apple Pay, Google Pay |

Custom gateways can be added by implementing the `PaymentGatewayAdapter` interface.

## Quick Start

### Install

```bash
npm install murai drizzle-orm postgres
# or
pnpm add murai drizzle-orm postgres
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
} from 'murai';

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
| --- | --- |
| [`murai`](./packages/murai) | Meta-package — single install, re-exports everything |
| [`@murai/core`](./packages/core) | Wallet, ledger, checkout manager, types, errors |
| [`@murai/gateway-midtrans`](./packages/gateway-midtrans) | Midtrans Snap adapter |
| [`@murai/gateway-stripe`](./packages/gateway-stripe) | Stripe Checkout adapter |
| [`@murai/gateway-xendit`](./packages/gateway-xendit) | Xendit Checkout adapter |
| [`@murai/storage-drizzle`](./packages/storage-drizzle) | Drizzle ORM storage (PostgreSQL) |

## Architecture

```text
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
                  Midtrans │ Stripe │ Xendit
```

**Key invariants:**

- Ledger entries are append-only — never updated or deleted
- Balance reads during writes use `SELECT FOR UPDATE` (row-level locking)
- All webhook credits use idempotency keys derived from the order ID

## API Reference

| Function | Returns |
| --- | --- |
| `createWallet({ storage })` | `{ getBalance, canSpend, spend, topUp, expireTokens, getUsageReport, getTransactions, getCheckouts }` |
| `createLedger(storage)` | `{ credit, debit, getBalance, getTransactions }` |
| `createCheckoutManager(gateway, ledger, storage)` | `{ createSession, handleWebhook }` |
| `createDrizzleStorage(db)` | `StorageAdapter` implementation |
| `createMidtransGateway(config)` | `PaymentGatewayAdapter` with `getPaymentStatus` |
| `createStripeGateway(config)` | `PaymentGatewayAdapter` with `getPaymentStatus` |
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

## Documentation

Full documentation with guides, API reference, and tutorials:

- [Installation](https://ebuntario.github.io/murai/getting-started/installation/)
- [Quick Start](https://ebuntario.github.io/murai/getting-started/quickstart/)
- [Next.js Integration](https://ebuntario.github.io/murai/guides/nextjs-integration/)
- [Webhook Verification](https://ebuntario.github.io/murai/guides/webhook-verification/)
- [Architecture](https://ebuntario.github.io/murai/guides/architecture/)
- [API Reference](https://ebuntario.github.io/murai/api-reference/core/)

### Example app

A working Next.js example is available at [`examples/nextjs/`](./examples/nextjs) — includes dashboard, top-up flow, webhook handler, and spend action.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features.

## License

[MIT](./LICENSE)
