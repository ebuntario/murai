# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-03-01

### Added

- **90% test coverage threshold** — CI now enforces 90% minimum on statements, branches, functions, and lines (up from 80%)
- **Security audit** — `SECURITY_AUDIT.md` documents all security measures: timing-safe webhook verification, idempotency constraints, row-level locking, SQL injection surface, amount and metadata validation
- **Performance benchmarks** — `benchmarks/spend.bench.ts` using `vitest bench` for sequential spend, concurrent spend, topUp+spend cycles, and getBalance reads
- **Migration guide** — `MIGRATION.md` covers upgrade paths from every prior version with code diff examples
- **Code of Conduct** — Contributor Covenant v2.1

### Changed

- **All packages bumped to 1.0.0** — semantic versioning stability guarantee: no breaking changes without a major version bump

## [0.4.0] - 2026-03-01

### Added

- **FIFO bucket-based token expiration** — `topUp` accepts optional `expiresAt` date; spends consume earliest-expiring buckets first (NULLS LAST for non-expiring credits)
- **`expireTokens(userId)`** — atomically debits remaining tokens from expired credit buckets; idempotent (safe to call repeatedly)
- **Usage reporting** — `getUsageReport(userId, { from, to })` aggregates credits, debits, and provider cost over a date range
- **Spend/topUp metadata** — optional `metadata` parameter (JSON string, <4KB) on `spend` and `topUp`; `cost` field convention for recording AI provider cost
- **Stripe Checkout gateway adapter** (`@token-wallet/gateway-stripe`) — `createCheckout`, `verifyWebhook` (HMAC-SHA256 with `rawBody`), `parseWebhookPayload`, `getPaymentStatus`
- **`rawBody` parameter on `verifyWebhook`** — `PaymentGatewayAdapter.verifyWebhook` now accepts optional third `rawBody` parameter (required by Stripe, ignored by Midtrans/Xendit)
- **New error types** — `InvalidExpirationError` (past `expiresAt`), `InvalidMetadataError` (invalid JSON, oversized, bad `cost`)
- **New types** — `ExpireResult`, `UsageReport`
- **Date range filtering** — `TransactionQuery` now supports `from` and `to` for date-based queries
- **Drizzle schema columns** — `expires_at`, `remaining`, `expired_at`, `metadata` on transactions table
- **Drizzle `expireCredits`** — atomic credit expiration with row locking
- **Drizzle `getUsersWithExpirableCredits`** — find users with credits ready to expire
- **Documentation** — Token Expiration guide, Usage Reporting guide, Stripe API reference, updated all existing docs
- **21 Stripe adapter tests** — webhook verification, status mapping, createCheckout, getPaymentStatus
- **139+ total tests** across all packages

### Changed

- **`Wallet.spend` signature** — added optional `options?: { metadata?: string }` parameter
- **`Wallet.topUp` signature** — added optional `options?: { expiresAt?: Date; metadata?: string }` parameter
- **`CheckoutManager.handleWebhook` params** — added optional `rawBody?: string | Buffer`
- **`LedgerEntry` interface** — added `expiresAt`, `remaining`, `expiredAt`, `metadata` fields (all optional, backward compatible)
- **`StorageAdapter` interface** — added optional `expireCredits` and `getUsersWithExpirableCredits` methods

## [0.3.0] - 2026-03-01

### Added

- **Documentation site** — Starlight (Astro) docs with 13 pages: installation, quickstart, project structure, architecture, webhook verification, choosing a gateway, Next.js integration, and full API reference (core, midtrans, xendit, drizzle, types, errors)
- **Next.js example app** (`examples/nextjs/`) — standalone Next.js 15 App Router demo with Tailwind CSS, Midtrans Snap, balance display, top-up/spend actions, webhook handler, and transaction history
- **Typechecked code examples** — `docs/src/examples/*.ts` files imported via `?raw` into MDX pages; CI build catches stale examples
- **Pagefind search** — full-text search across all documentation pages
- **Hono webhook snippet** — code example in Next.js integration guide (no separate app)

### Changed

- **`pnpm-workspace.yaml`** — added `docs` workspace, removed `examples/*` (example app is standalone)

## [0.2.0] - 2026-02-28

### Added

- **Xendit Checkout gateway adapter** (`@token-wallet/gateway-xendit`) — `createCheckout`, `verifyWebhook`, `parseWebhookPayload`, `getPaymentStatus`
- **Midtrans `getPaymentStatus`** — poll Midtrans Status API for payment status
- **Ledger query API** — `getTransactions(userId, { limit, offset, type })` with pagination (1-100) and credit/debit filtering
- **Checkout query API** — `getCheckouts(userId, { limit, offset, status })` with pagination and status filtering
- **`WebhookResult` return type** — `handleWebhook` now returns `{ action: 'credited' | 'skipped' | 'duplicate', reason? }` for richer HTTP responses
- **Expired/failed webhook handling** — webhooks with `expired` or `failed` status now update checkout status to `'failed'`
- **Configurable fetch timeout** — `timeoutMs` option on both Midtrans and Xendit configs (default 30s)
- **Storage integration tests** — 11 tests against real PostgreSQL (skipped without `DATABASE_URL`)
- **Drizzle storage** — `getTransactions` and `getCheckouts` with pagination, type/status filtering
- **Repo essentials** — README, CONTRIBUTING, SECURITY, CHANGELOG, GitHub Actions CI

### Changed

- **`handleWebhook` return type** — changed from `Promise<void>` to `Promise<WebhookResult>` (breaking)
- **Midtrans dual hosts** — `snapHost` for Snap API, `apiHost` for Status API

### Fixed

- **Midtrans timing-safe verification** (SECURITY) — replaced `===` string comparison with `crypto.timingSafeEqual` on hex buffers

### Removed

- **`schemas.ts`** — unused type aliases removed from `@token-wallet/core`

## [0.1.0] - 2026-02-27

### Added

- **Core wallet operations** — `getBalance`, `canSpend`, `spend`, `topUp` with atomic balance management
- **Append-only ledger** — `credit`, `debit` with idempotency keys and double-entry accounting
- **Checkout manager** — `createSession`, `handleWebhook` with gateway abstraction
- **Typed error hierarchy** — `InsufficientBalanceError`, `IdempotencyConflictError`, `WebhookVerificationError`, `InvalidAmountError`, `GatewayError`
- **Midtrans Snap adapter** — `createCheckout`, `verifyWebhook` (SHA512), `parseWebhookPayload`
- **Drizzle ORM storage adapter** — PostgreSQL with BIGINT amounts, SELECT FOR UPDATE, unique constraint idempotency
- **Meta-package** — `token-wallet` re-exports core + midtrans + drizzle
- **50 unit tests** across core, midtrans, and checkout
