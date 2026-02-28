# Token Wallet — Roadmap

- [Token Wallet — Roadmap](#token-wallet--roadmap)
  - [Current Status](#current-status)
  - [v0.1.0 — Minimum Viable Library](#v010--minimum-viable-library)
    - [What users get](#what-users-get)
    - [What to build](#what-to-build)
      - [Tests](#tests)
      - [Repo essentials](#repo-essentials)
  - [v0.2.0 — Second Gateway + Reliability](#v020--second-gateway--reliability)
    - [What users get](#what-users-get-1)
    - [What to build](#what-to-build-1)
      - [Ledger query API](#ledger-query-api)
      - [Tests](#tests-1)
  - [v0.3.0 — Developer Experience](#v030--developer-experience)
    - [What users get](#what-users-get-2)
    - [What to build](#what-to-build-2)
      - [Example apps](#example-apps)
      - [Documentation site](#documentation-site)
  - [v0.4.0 — Production Features](#v040--production-features)
    - [What users get](#what-users-get-3)
    - [What to build](#what-to-build-3)
      - [Token expiration](#token-expiration)
      - [Margin reporting](#margin-reporting)
  - [v1.0.0 — Stable Release](#v100--stable-release)
    - [What users get](#what-users-get-4)
    - [What to build](#what-to-build-4)
  - [Future / Backlog](#future--backlog)
  - [Explicit Non-Goals](#explicit-non-goals)
  - [Release Philosophy](#release-philosophy)

A lightweight, payment-gateway-agnostic token wallet library for AI/SaaS applications — with first-class support for Indonesian payment gateways (Midtrans Snap, Xendit Checkout).

---

## Current Status

**v0.1.0 shipped.** Core, Midtrans Snap, and Drizzle storage are fully implemented with 50 unit tests. All packages build, typecheck, and pass Biome lint.

| Package | Status |
| --- | --- |
| `@token-wallet/core` — wallet, ledger, checkout, types, errors | ✅ Done |
| `@token-wallet/gateway-midtrans` | ✅ Done |
| `@token-wallet/gateway-xendit` | 🔲 Stub (v0.2.0) |
| `@token-wallet/storage-drizzle` | ✅ Done |
| `token-wallet` (meta-package) | ✅ Done |
| Tests (core + midtrans) | ✅ 50 tests |
| Storage integration tests | 🔲 Deferred — requires PostgreSQL (v0.2.0) |
| Documentation | 🔲 v0.3.0 |

---

## v0.1.0 — Minimum Viable Library

> **Goal:** A developer can go from zero to "users can buy tokens and spend them" in under 30 minutes, backed by Midtrans Snap and PostgreSQL.

### What users get

- Install one package, configure two things (gateway + database), and have a working credit wallet
- Users can top up their wallet via Midtrans Snap (redirect flow)
- Token spend is atomic — no overdrafts, no double-charges
- Every transaction is permanently recorded in an append-only ledger

### What to build

**Storage adapter (`@token-wallet/storage-drizzle`)**

- [x] Drizzle schema: `wallets`, `transactions`, `checkouts` tables (BIGINT for IDR amounts)
- [x] `StorageAdapter` implementation with `SELECT FOR UPDATE` on balance reads
- [x] Idempotency key deduplication at the DB level (UNIQUE constraint + `IdempotencyConflictError`)
- [ ] MySQL and SQLite dialect support (PostgreSQL only for now)

**Midtrans gateway adapter (`@token-wallet/gateway-midtrans`)**

- [x] `createCheckout` — call Snap API, return `redirect_url`
- [x] `verifyWebhook` — SHA512 signature verification (`order_id + status_code + gross_amount + ServerKey`)
- [x] `parseWebhookPayload` — maps Midtrans statuses to gateway-agnostic `WebhookStatus`
- [ ] `getPaymentStatus` — poll Midtrans for status (fallback if webhook is delayed)

**Meta-package (`token-wallet`)**

- [x] Re-export core + gateway-midtrans + storage-drizzle for a single-install experience

#### Tests

- [x] Core: `spend()`, `topUp()`, `getBalance()`, `canSpend()` — happy paths and edge cases
- [x] Ledger: append-only invariant, idempotency, invalid amount validation
- [x] Midtrans adapter: webhook signature verification (valid, tampered, wrong key, non-object), status mapping (all 6 statuses)
- [x] Checkout: `createSession` persistence, `handleWebhook` full flow including eventual consistency path
- [ ] Storage integration tests (requires PostgreSQL / Testcontainers — deferred to v0.2.0)

#### Repo essentials

- [ ] `README.md` with installation + 5-minute quickstart
- [ ] `CONTRIBUTING.md`
- [ ] `SECURITY.md` (responsible disclosure process)
- [ ] `CHANGELOG.md`
- [ ] GitHub Actions CI: lint + typecheck + test on every PR

---

## v0.2.0 — Second Gateway + Reliability

> **Goal:** Xendit support is live. Webhooks are bulletproof. Developers can query transaction history.

### What users get

- Full Xendit Checkout support (payment links, e-wallets, QRIS, virtual accounts)
- Webhook retry handling — Xendit retries up to 6 times; duplicate credits are impossible
- Transaction history API for building "my usage" screens in their app
- Storage integration tests so the DB-level invariants are machine-verified

### What to build

**Xendit gateway adapter (`@token-wallet/gateway-xendit`)**

- [ ] `createCheckout` — create Xendit Payment Link, return `invoice_url`
- [ ] `verifyWebhook` — `x-callback-token` header verification
- [ ] `parseWebhookPayload` — map Xendit statuses to `WebhookStatus`
- [ ] `getPaymentStatus` — poll Xendit invoice status

**Midtrans gap (carried from v0.1.0)**

- [ ] `getPaymentStatus` — poll Midtrans for status (fallback if webhook is delayed)

#### Ledger query API

- [ ] `getTransactions(userId, { limit, offset, type })` — paginated transaction history
- [ ] `getCheckouts(userId, { limit, offset, status })` — purchase history

#### Reliability

- [ ] `handleWebhook` return type: `{ action: 'credited' | 'skipped' | 'duplicate' }` for richer HTTP responses
- [ ] Configurable fetch timeout on `createCheckout` (currently uses fetch default)

#### Tests

- [ ] Storage integration tests with Testcontainers (PostgreSQL) — `SELECT FOR UPDATE`, unique constraint, concurrent debit prevention
- [ ] Xendit adapter: webhook verification, idempotency under retry storms
- [ ] Ledger: transaction pagination, filtering by type

#### Repo essentials (carried from v0.1.0)

- [ ] `README.md` with installation + 5-minute quickstart
- [ ] `CONTRIBUTING.md`
- [ ] `SECURITY.md`
- [ ] `CHANGELOG.md`
- [ ] GitHub Actions CI: lint + typecheck + test on every PR

---

## v0.3.0 — Developer Experience

> **Goal:** Any developer can integrate token-wallet into a real Next.js or Express app by following a documented example — without reading the source code.

### What users get

- Working example apps to copy from
- Documentation site with full API reference and guides

### What to build

#### Example apps

- [ ] `examples/nextjs/` — Next.js App Router: top-up flow, webhook route, balance display, spend on AI call
- [ ] `examples/hono/` — Hono API: same flow, minimal setup

#### Documentation site

- [ ] Quickstart guide (5 minutes to working wallet)
- [ ] API reference (auto-generated from types + hand-written descriptions)
- [ ] "How webhook verification works" guide
- [ ] "Choosing between Midtrans and Xendit" guide
- [ ] Architecture explainer (ledger, idempotency, race conditions)

---

## v0.4.0 — Production Features

> **Goal:** Production-grade features that enterprise AI SaaS apps need before going live.

### What users get

- Token expiration (credits bought before a date can be set to expire)
- Margin visibility — builders can see whether they're making or losing money per user
- Stripe support for global reach beyond Southeast Asia

### What to build

#### Token expiration

- [ ] `expires_at` field on credits
- [ ] `expireTokens()` job — callable by a cron, marks expired credits in the ledger
- [ ] `getBalance()` respects expiration automatically

#### Margin reporting

- [ ] `getMarginReport(userId, dateRange)` — revenue collected vs. cost recorded in metadata
- [ ] Structured `metadata` convention for recording AI provider cost at spend time

**Stripe gateway adapter (`@token-wallet/gateway-stripe`)**

- [ ] `createCheckout` — Stripe Checkout Session
- [ ] `verifyWebhook` — Stripe HMAC signature verification

---

## v1.0.0 — Stable Release

> **Goal:** A library anyone can drop into a production AI product with confidence — fully tested, audited, and documented.

### What users get

- Semantic versioning stability (no breaking changes without a major version bump)
- A public security audit
- Clear migration guides for every breaking change since v0.1

### What to build

- [ ] 90%+ test coverage enforced in CI
- [ ] Security audit (webhook verification, idempotency, race conditions, SQL injection surface)
- [ ] Performance benchmarks for high-throughput spend operations
- [ ] `MIGRATION.md` — upgrade guides from each prior version
- [ ] `CODE_OF_CONDUCT.md`

---

## Future / Backlog

These are real, considered ideas from the research phase — but explicitly not v1 scope. They require more design work before committing to an API.

| Idea | Notes |
| --- | --- |
| **Subscription model** — recurring credit top-ups (e.g., "1,000 tokens/month") | Needs a scheduler integration; complex cancellation logic |
| **DOKU gateway adapter** | Third Indonesian gateway; lower priority than Midtrans/Xendit |
| **SQLite storage adapter** (standalone, no Drizzle) | Good for prototyping and tests; Drizzle already supports SQLite via dialect |
| **`@token-wallet/pricing-helper`** | Optional table for mapping AI model token costs to wallet token cost |
| **Multi-wallet per user** | e.g., one wallet per product or subscription tier |
| **Team/shared wallets** | Shared balance across org members |

---

## Explicit Non-Goals

These use cases are **out of scope by design** and won't be added:

- User-to-user token transfers
- Refunds back to original payment method (issue a credit to the wallet instead)
- Real-time streaming billing (deduct after completion, not mid-stream)
- Crypto/blockchain token integration
- B2B net-30 invoicing (post-pay)
- Pay-per-result (only pay if the AI output is "good")
- Token expiration with legal/regulatory compliance guarantees

See [RESEARCH.md](./RESEARCH.md#18-use-cases-that-wont-work-and-why-thats-okay) for the full reasoning behind each exclusion.

---

## Release Philosophy

- **Ship fast, iterate in public.** A working v0.1 beats a perfect v0.0.
- **Breaking changes require a major version.** Patch and minor releases are always backward-compatible.
- **Every new exported function requires a test.** Payment code with untested paths costs people real money.
- **Say no by default.** Staying focused on being the best token wallet is more valuable than becoming another full billing platform.
