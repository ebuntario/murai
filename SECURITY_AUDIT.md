# Security Audit — token-wallet v1.0.0

Last reviewed: 2026-03-01

This document summarizes the security measures in the token-wallet library, covering webhook verification, idempotency, race conditions, injection surfaces, and input validation.

---

## 1. Webhook Signature Verification

All three gateway adapters verify webhook signatures using **timing-safe comparison** (`crypto.timingSafeEqual`) to prevent timing attacks.

| Gateway | Algorithm | Implementation |
| --- | --- | --- |
| Midtrans | SHA512(`order_id + status_code + gross_amount + serverKey`) | `packages/gateway-midtrans/src/index.ts` — `verifyWebhook()` |
| Xendit | `x-callback-token` header vs configured secret | `packages/gateway-xendit/src/index.ts` — `verifyWebhook()` |
| Stripe | HMAC-SHA256 with `rawBody` + 5-minute timestamp tolerance | `packages/gateway-stripe/src/index.ts` — `verifyWebhook()` |

**Measures applied:**

- Buffer length check before `timingSafeEqual` (prevents crash on mismatched lengths)
- Stripe verifies timestamp to reject replayed webhooks (300-second tolerance)
- All gateways wrap verification in try-catch — malformed payloads return `false`, never throw to the caller
- `WebhookVerificationError` thrown by `handleWebhook()` in `packages/core/src/checkout.ts` when verification fails

**Test coverage:**

- Valid signature, tampered payload, wrong key, non-object payload, missing fields — tested per gateway
- Stripe: expired timestamp, missing rawBody, invalid signature header format

---

## 2. Idempotency

Webhook re-delivery and network retries must never double-credit a wallet.

**Database-level enforcement:**

- `idempotency_key` column has a `UNIQUE` constraint — `packages/storage-drizzle/src/index.ts` (schema definition)
- PostgreSQL error code `23505` (unique violation) is caught by `isUniqueViolation()` and re-thrown as `IdempotencyConflictError`

**Application-level enforcement:**

- `handleWebhook()` derives idempotency keys as `webhook:<orderId>` — deterministic, not caller-controlled
- Primary guard: checkout session status checked before crediting (`session.status !== 'pending'` returns `{ action: 'skipped' }`)
- Secondary guard: `IdempotencyConflictError` caught in `handleWebhook()` — returns `{ action: 'duplicate' }` instead of propagating

**Test coverage:**

- Duplicate webhook delivery returns `'duplicate'` action
- Concurrent identical webhooks — only one succeeds (integration test with PostgreSQL)

---

## 3. Race Conditions

Concurrent spend operations must never overdraft a wallet.

**Row-level locking:**

- `SELECT ... FOR UPDATE` on the wallet row before reading balance — `packages/storage-drizzle/src/index.ts`, `appendEntry()` function
- Same lock applied to credit bucket rows during FIFO debit processing
- Same lock applied during `expireCredits()` to prevent concurrent expiration

**Transaction isolation:**

- All balance mutations happen inside a database transaction (`db.transaction()`)
- The `FOR UPDATE` lock is held for the duration of the transaction, serializing concurrent debits on the same wallet

**Test coverage:**

- Integration test: two concurrent 60-token debits against a 100-token balance — exactly one succeeds, one gets `InsufficientBalanceError`

---

## 4. SQL Injection Surface

**Assessment: Low risk.**

- All database queries use **Drizzle ORM** with parameterized queries — no raw SQL string concatenation
- User-supplied values (userId, amounts, metadata) are always passed as parameters, never interpolated
- No `sql.raw()` or template literal queries in the codebase

---

## 5. Amount Validation

All monetary amounts are validated before reaching the database.

**Validation rules** (enforced in `packages/core/src/ledger.ts`, `credit()` and `debit()` functions):

- Must be a positive integer (`Number.isInteger(amount) && amount > 0`)
- Throws `InvalidAmountError` on violation

**Database representation:**

- BIGINT columns in PostgreSQL — no floating-point precision issues
- Amounts are always in the smallest currency unit (e.g., IDR, not IDR/100)

**Pagination validation** (in `getTransactions()` and `getCheckouts()`):

- `limit` clamped to 1–100
- `offset` must be non-negative

---

## 6. Metadata Validation

User-supplied metadata on `spend()` and `topUp()` is validated before storage.

**Validation rules** (enforced in `packages/core/src/wallet.ts`, `validateMetadata()` function):

- Must be valid JSON (parse check)
- Must be a JSON object (not array, not null, not primitive)
- Must not exceed 4,096 bytes (4KB) — prevents oversized payloads
- If `cost` field is present, must be a non-negative finite number

**Error handling:**

- Throws `InvalidMetadataError` with a descriptive `reason` string

---

## 7. Error Hierarchy

All domain errors extend `TokenWalletError` (defined in `packages/core/src/errors.ts`) with a typed `code` string for programmatic error handling:

| Error | Code | Trigger |
| --- | --- | --- |
| `InsufficientBalanceError` | `INSUFFICIENT_BALANCE` | `spend()` with amount > balance |
| `IdempotencyConflictError` | `IDEMPOTENCY_CONFLICT` | Duplicate idempotency key |
| `WebhookVerificationError` | `WEBHOOK_VERIFICATION_FAILED` | Invalid webhook signature |
| `InvalidAmountError` | `INVALID_AMOUNT` | Non-positive or non-integer amount |
| `GatewayError` | `GATEWAY_ERROR` | Payment gateway API failure |
| `InvalidExpirationError` | `INVALID_EXPIRATION` | `expiresAt` in the past |
| `InvalidMetadataError` | `INVALID_METADATA` | Malformed or oversized metadata |

---

## 8. Threat Model Summary

| Threat | Mitigation | Status |
| --- | --- | --- |
| Forged webhooks | Timing-safe signature verification per gateway | Mitigated |
| Webhook replay (Stripe) | 5-minute timestamp tolerance | Mitigated |
| Double-credit from retries | UNIQUE constraint + application-level idempotency | Mitigated |
| Concurrent overdraft | `SELECT FOR UPDATE` row locking in transactions | Mitigated |
| SQL injection | Drizzle ORM parameterized queries (no raw SQL) | Mitigated |
| Negative/fractional amounts | `InvalidAmountError` validation | Mitigated |
| Oversized metadata | 4KB limit + JSON structure validation | Mitigated |
| Timing attack on signatures | `crypto.timingSafeEqual` on all gateways | Mitigated |

---

## Scope Limitations

This audit covers the token-wallet library code only. It does **not** cover:

- The security of the underlying database deployment (network access, TLS, credentials)
- The security of the payment gateway accounts (API key rotation, IP allowlisting)
- The application code that integrates token-wallet (input sanitization, authentication, authorization)
- Infrastructure concerns (DDoS, rate limiting, logging/monitoring)

Integrators are responsible for securing their own deployment environment.
