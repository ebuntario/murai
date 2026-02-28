# Changelog

All notable changes to this project will be documented in this file.

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
