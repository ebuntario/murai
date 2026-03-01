# Murai — Roadmap

- [Murai — Roadmap](#murai--roadmap)
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
      - [Reliability](#reliability)
      - [Tests](#tests-1)
      - [Repo essentials](#repo-essentials-1)
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

**v1.0.0 shipped.** All packages are at 1.0.0 with semantic versioning stability guarantees. The library is production-ready with three gateways, PostgreSQL storage, token expiration, usage reporting, 90%+ test coverage, a security audit, and comprehensive documentation.

| Package | Status |
| --- | --- |
| `@murai-wallet/core` — wallet, ledger, checkout, types, errors | ✅ 1.0.0 |
| `@murai-wallet/gateway-midtrans` | ✅ 1.0.0 |
| `@murai-wallet/gateway-xendit` | ✅ 1.0.0 |
| `@murai-wallet/gateway-stripe` | ✅ 1.0.0 |
| `@murai-wallet/storage-drizzle` | ✅ 1.0.0 |
| `murai` (meta-package) | ✅ 1.0.0 |
| Tests (core + midtrans + xendit + stripe + integration) | ✅ 139+ tests |
| Storage integration tests | ✅ Done (requires `DATABASE_URL`) |
| Repo essentials (README, CONTRIBUTING, SECURITY, CHANGELOG) | ✅ Done |
| Documentation site (Starlight) | ✅ Done |
| Next.js example app | ✅ Done |
| Token expiration (FIFO buckets) | ✅ Done |
| Usage reporting | ✅ Done |
| 90%+ test coverage in CI | ✅ Done |
| Security audit | ✅ Done |
| Performance benchmarks | ✅ Done |
| Migration guide | ✅ Done |
| Code of Conduct | ✅ Done |

---

## v0.1.0 — Minimum Viable Library

> **Goal:** A developer can go from zero to "users can buy tokens and spend them" in under 30 minutes, backed by Midtrans Snap and PostgreSQL.

### What users get

- Install one package, configure two things (gateway + database), and have a working credit wallet
- Users can top up their wallet via Midtrans Snap (redirect flow)
- Token spend is atomic — no overdrafts, no double-charges
- Every transaction is permanently recorded in an append-only ledger

### What to build

**Storage adapter (`@murai-wallet/storage-drizzle`)**

- [x] Drizzle schema: `wallets`, `transactions`, `checkouts` tables (BIGINT for IDR amounts)
- [x] `StorageAdapter` implementation with `SELECT FOR UPDATE` on balance reads
- [x] Idempotency key deduplication at the DB level (UNIQUE constraint + `IdempotencyConflictError`)
- [ ] MySQL and SQLite dialect support (PostgreSQL only for now)

**Midtrans gateway adapter (`@murai-wallet/gateway-midtrans`)**

- [x] `createCheckout` — call Snap API, return `redirect_url`
- [x] `verifyWebhook` — SHA512 signature verification (`order_id + status_code + gross_amount + ServerKey`)
- [x] `parseWebhookPayload` — maps Midtrans statuses to gateway-agnostic `WebhookStatus`
- [x] `getPaymentStatus` — poll Midtrans Status API for payment status

**Meta-package (`murai`)**

- [x] Re-export core + gateway-midtrans + storage-drizzle for a single-install experience

#### Tests

- [x] Core: `spend()`, `topUp()`, `getBalance()`, `canSpend()` — happy paths and edge cases
- [x] Ledger: append-only invariant, idempotency, invalid amount validation
- [x] Midtrans adapter: webhook signature verification (valid, tampered, wrong key, non-object), status mapping (all 6 statuses), getPaymentStatus
- [x] Checkout: `createSession` persistence, `handleWebhook` full flow including eventual consistency path
- [x] Storage integration tests (PostgreSQL via Neon)

#### Repo essentials

- [x] `README.md` with installation + 5-minute quickstart
- [x] `CONTRIBUTING.md`
- [x] `SECURITY.md` (responsible disclosure process)
- [x] `CHANGELOG.md`
- [x] GitHub Actions CI: lint + typecheck + test on every PR

---

## v0.2.0 — Second Gateway + Reliability

> **Goal:** Xendit support is live. Webhooks are bulletproof. Developers can query transaction history.

### What users get

- Full Xendit Checkout support (payment links, e-wallets, QRIS, virtual accounts)
- Webhook retry handling — Xendit retries up to 6 times; duplicate credits are impossible
- Transaction history API for building "my usage" screens in their app
- Storage integration tests so the DB-level invariants are machine-verified

### What to build

**Xendit gateway adapter (`@murai-wallet/gateway-xendit`)**

- [x] `createCheckout` — create Xendit invoice, return `invoice_url`
- [x] `verifyWebhook` — `x-callback-token` header verification (timing-safe)
- [x] `parseWebhookPayload` — map Xendit statuses to `WebhookStatus`
- [x] `getPaymentStatus` — poll Xendit invoice status

#### Midtrans improvements

- [x] `getPaymentStatus` — poll Midtrans Status API for payment status
- [x] Timing-safe webhook verification (`crypto.timingSafeEqual`)
- [x] Dual base hosts (`snapHost` for Snap API, `apiHost` for Status API)
- [x] Configurable `timeoutMs` on fetch calls

#### Ledger query API

- [x] `getTransactions(userId, { limit, offset, type })` — paginated transaction history
- [x] `getCheckouts(userId, { limit, offset, status })` — purchase history

#### Reliability

- [x] `handleWebhook` return type: `{ action: 'credited' | 'skipped' | 'duplicate', reason? }` for richer HTTP responses
- [x] Expired/failed webhooks update checkout status to `'failed'`
- [x] Configurable fetch timeout on `createCheckout` and `getPaymentStatus`

#### Tests

- [x] Storage integration tests with Neon PostgreSQL — `SELECT FOR UPDATE`, unique constraint, concurrent debit prevention
- [x] Xendit adapter: webhook verification, status mapping, createCheckout, getPaymentStatus
- [x] Ledger: transaction pagination, filtering by type, validation errors

#### Repo essentials

- [x] `README.md` with installation + 5-minute quickstart + architecture diagram
- [x] `CONTRIBUTING.md`
- [x] `SECURITY.md`
- [x] `CHANGELOG.md`
- [x] GitHub Actions CI: lint + typecheck + test on every PR (integration tests on main)

---

## v0.3.0 — Developer Experience

> **Goal:** Any developer can integrate murai into a real Next.js or Express app by following a documented example — without reading the source code.

### What users get

- Working Next.js example app to copy from
- Documentation site with full API reference and guides (Starlight)
- Hono webhook snippet in docs (no separate app)

### What to build

#### Example apps

- [x] `examples/nextjs/` — Next.js App Router: top-up flow, webhook route, balance display, spend action
- [x] Hono webhook snippet in Next.js integration guide

#### Documentation site

- [x] Starlight docs site (`docs/`) with Pagefind search
- [x] Quickstart guide (5 minutes to working wallet)
- [x] Hand-written API reference (6 pages — core, midtrans, xendit, drizzle, types, errors)
- [x] "How webhook verification works" guide
- [x] "Choosing between Midtrans and Xendit" guide
- [x] Architecture explainer (ledger, idempotency, race conditions)
- [x] Next.js integration guide (references example app)
- [x] Installation guide, project structure page
- [x] Typechecked code examples (`docs/src/examples/*.ts` with `?raw` imports)

---

## v0.4.0 — Production Features

> **Goal:** Production-grade features that enterprise AI SaaS apps need before going live.

### What users get

- Token expiration (credits bought before a date can be set to expire)
- Margin visibility — builders can see whether they're making or losing money per user
- Stripe support for global reach beyond Southeast Asia

### What to build

#### Token expiration

- [x] FIFO bucket-based expiration — each `topUp` creates a bucket with `remaining` and optional `expiresAt`
- [x] `expireTokens()` job — callable by a cron, atomically debits remaining tokens from expired buckets
- [x] FIFO spend ordering — earliest-expiring buckets consumed first, NULLS LAST for non-expiring

#### Usage reporting

- [x] `getUsageReport(userId, dateRange)` — aggregates credits, debits, and provider cost over a date range
- [x] Structured `metadata` convention for recording AI provider cost at spend time (`{ "cost": 0.05 }`)
- [x] Metadata validation — valid JSON, <4KB, cost must be non-negative finite number

**Stripe gateway adapter (`@murai-wallet/gateway-stripe`)** (added beyond original scope)

- [x] `createCheckout` — Stripe Checkout Sessions API (form-encoded)
- [x] `verifyWebhook` — HMAC-SHA256 with `rawBody`, 5-minute timestamp tolerance
- [x] `parseWebhookPayload` — `checkout.session.completed` and `checkout.session.expired`
- [x] `getPaymentStatus` — maps Stripe `payment_status` to `WebhookStatus`

---

## v1.0.0 — Stable Release

> **Goal:** A library anyone can drop into a production AI product with confidence — fully tested, audited, and documented.

### What users get

- Semantic versioning stability (no breaking changes without a major version bump)
- A public security audit
- Clear migration guides for every breaking change since v0.1

### What to build

- [x] 90%+ test coverage enforced in CI
- [x] Security audit (webhook verification, idempotency, race conditions, SQL injection surface)
- [x] Performance benchmarks for high-throughput spend operations
- [x] `MIGRATION.md` — upgrade guides from each prior version
- [x] `CODE_OF_CONDUCT.md`

---

## Future / Backlog

These are real, considered ideas from the research phase — but explicitly not v1 scope. They require more design work before committing to an API.

| Idea | Notes |
| --- | --- |
| **Subscription model** — recurring credit top-ups (e.g., "1,000 tokens/month") | Needs a scheduler integration; complex cancellation logic |
| **DOKU gateway adapter** | Third Indonesian gateway; lower priority than Midtrans/Xendit |
| **SQLite storage adapter** (standalone, no Drizzle) | Good for prototyping and tests; Drizzle already supports SQLite via dialect |
| **`@murai-wallet/pricing-helper`** | Optional table for mapping AI model token costs to wallet token cost |
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
