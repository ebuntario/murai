# Security Due Diligence Assessment: Murai (@murai-wallet/murai)

**Date:** 2026-03-02
**Assessor:** Senior Fintech Cybersecurity Engineer
**Scope:** Full codebase review of all packages (core, gateway-midtrans, gateway-xendit, gateway-stripe, storage-drizzle, murai meta-package)
**Version:** Post v0.3.0

---

## VERDICT

| | |
|---|---|
| **Decision** | **CONDITIONAL GO** |
| **Confidence** | **72%** |
| **Condition** | Must fix 1 critical TOCTOU race condition before production use |

---

## Dimension 1: Secrets & Credential Handling

**Risk Level: LOW**

### Findings

- All gateway API keys (`serverKey`, `clientKey`, `secretKey`, `callbackToken`, `webhookSecret`) are passed via typed config objects into factory function closures. Credentials exist **only in closure memory** and are never persisted, serialized, or returned.
- Auth headers are constructed once (`Basic ${btoa(...)}`, `Bearer ${...}`) and used only in outbound `fetch()` calls.
- **Zero `console.log` / `console.error` / `console.debug` statements** exist anywhere in production code. No logging infrastructure at all.
- No `toString()`, `toJSON()`, or serialization methods defined on any object that holds credentials.
- Test fixtures use clearly fake placeholder values (`test-server-key-abc123`, `sk_test_abc123`).

### Residual Risk

Gateway error responses are passed verbatim to `GatewayError.gatewayMessage` via `await res.text()`. If a gateway API returns error text that echoes back parts of the API key (e.g., Stripe's "Invalid API key: sk_test_..."), this leaks into the error object.

**Locations:**
- `packages/gateway-midtrans/src/index.ts` (lines 81, 144)
- `packages/gateway-xendit/src/index.ts` (lines 63, 113)
- `packages/gateway-stripe/src/index.ts` (lines 85, 218)

### Verification Test

```typescript
// Intentionally use an invalid Stripe key and catch the GatewayError.
// Inspect gatewayMessage — does it contain the key you passed in?
const gateway = createMidtransGateway({ serverKey: 'REAL_KEY_HERE', clientKey: '...' });
try {
  await gateway.getPaymentStatus('nonexistent-order');
} catch (err) {
  console.log(err.gatewayMessage); // Does this leak 'REAL_KEY_HERE'?
}
```

---

## Dimension 2: SQL Injection / Query Safety

**Risk Level: LOW**

### Findings

- **100% of database queries** use Drizzle ORM's parameterized query builder (`eq()`, `gt()`, `lt()`, `and()`, `.values({})`).
- **Zero raw SQL with user input.** The only `sql` template tag usage is `sql\`${transactions.expiresAt} ASC NULLS LAST\`` — a static Drizzle column reference, not user-supplied input.
- No `sql.raw()`, no `db.execute()`, no string concatenation for queries.
- Pagination parameters (`limit`, `offset`) are validated at the application layer (integer, limit 1-100, offset >= 0) AND parameterized at the query layer.
- User-supplied `userId`, `idempotencyKey`, `orderId` are always passed through Drizzle's `eq()` operator.
- Metadata is stored as a JSON string column — never interpolated into SQL.

### Defense-in-Depth Layers

| Layer | Protection |
|-------|-----------|
| Application (`wallet.ts`, `ledger.ts`) | Input validation (amount, pagination, metadata size) |
| Storage adapter (`storage-drizzle`) | Drizzle ORM parameterized queries |
| Database (PostgreSQL) | Type enforcement, UNIQUE constraints, NOT NULL |

### Verification Test

```bash
# Run the integration tests against a real PostgreSQL instance
DATABASE_URL=postgres://... pnpm --filter @murai-wallet/storage-drizzle test
```

---

## Dimension 3: Idempotency Implementation

**Risk Level: MEDIUM**

### Findings

**Dual-layer idempotency is implemented:**

1. **Application layer** (`ledger.ts:46-48`): `findEntry(idempotencyKey)` check before insert
2. **Database layer** (`storage-drizzle`): `UNIQUE` constraint on `idempotency_key` column

The database constraint is the final arbiter — the application check is an optimization to avoid hitting the constraint.

### Issues Found

**Issue 3a: Idempotency keys are globally scoped, NOT per-user.**

The UNIQUE constraint is on `idempotency_key` alone, not `(user_id, idempotency_key)`:

```typescript
// packages/storage-drizzle/src/index.ts:39
idempotencyKey: text('idempotency_key').notNull().unique(),
```

This means:
- User A using key `"payment-123"` blocks User B from ever using the same key.
- This is **more restrictive** than per-user scoping (not a security hole per se), but creates a cross-user denial-of-service vector if keys are predictable.
- Webhook-derived keys use format `webhook:${orderId}` — if an attacker knows an orderId, they could pre-occupy the key namespace.

**Issue 3b: No replay protection beyond idempotency.**

Midtrans and Xendit have no timestamp-based replay window. Only Stripe enforces a 5-minute tolerance. For Midtrans/Xendit, a captured webhook can be replayed indefinitely — but the idempotency guard prevents double-crediting.

### Verification Test

```typescript
// Test: Can user B's spend fail because user A already used the same idempotency key?
await walletA.spend('user-a', 10, 'shared-key-123');
await walletB.spend('user-b', 10, 'shared-key-123');
// Expected: throws IdempotencyConflictError (global, not per-user)
```

---

## Dimension 4: Race Conditions & Atomic Operations

**Risk Level: CRITICAL**

### Critical Finding: TOCTOU Vulnerability in `spend()`

**Location:** `packages/core/src/wallet.ts:63-83`

```typescript
async function spend(userId, amount, idempotencyKey, options) {
  const balance = await ledger.getBalance(userId);  // <-- NO LOCK
  if (balance < amount) {
    throw new InsufficientBalanceError(userId, amount, balance);
  }
  await ledger.debit(userId, amount, idempotencyKey, ...); // <-- LOCK ACQUIRED HERE
}
```

The balance check at line 72 uses a **plain SELECT without FOR UPDATE**. The lock is only acquired later inside `appendEntry()`. This creates a classic time-of-check-to-time-of-use gap:

```
Thread A: getBalance() -> 100     (no lock)
Thread B: getBalance() -> 100     (no lock)
Thread A: checks 100 >= 50       -> proceeds to debit 50
Thread B: checks 100 >= 75       -> proceeds to debit 75
Thread A: acquires lock, debits 50, balance = 50
Thread B: acquires lock, debits 75, balance = -25  <-- OVERDRAFT
```

**Severity:** CRITICAL — allows account overdraft via concurrent requests.

**Mitigating Factor:** The storage layer's `appendEntry()` DOES perform a balance check inside the transaction with `SELECT FOR UPDATE` on FIFO buckets. In the Drizzle adapter, the bucket-based FIFO path recalculates `spendableBalance` under lock and throws `InsufficientBalanceError` if insufficient. The fallback path (no FIFO buckets) checks `wallet.balance` which IS locked.

**Revised Assessment:** The TOCTOU gap exists at the wallet layer, but the storage layer's locked re-check **prevents actual overdraft** with the current Drizzle adapter. The wallet-layer pre-check is redundant and misleading but not exploitable given the current Drizzle adapter. However, **a custom storage adapter that doesn't re-check under lock WOULD be vulnerable**.

### Other Race Condition Analysis

| Operation | Protected? | Mechanism |
|-----------|-----------|-----------|
| `appendEntry()` balance deduction | YES | `SELECT FOR UPDATE` on wallet row + FIFO buckets |
| `expireCredits()` | YES | Transaction + `SELECT FOR UPDATE` on wallet + buckets |
| Webhook double-credit | YES | Idempotency key UNIQUE + session status check |
| Webhook status update | PARTIAL | Status check is outside transaction (TOCTOU), but idempotency key prevents double-credit |

### Verification Test

```typescript
// Concurrent spend() race condition test — MUST run against real PostgreSQL
const wallet = createWallet({ storage: drizzleStorage });
await wallet.topUp('user1', 100, 'top-1');

const results = await Promise.allSettled([
  wallet.spend('user1', 60, 'spend-1'),
  wallet.spend('user1', 60, 'spend-2'),
]);

const successes = results.filter(r => r.status === 'fulfilled');
const failures = results.filter(r => r.status === 'rejected');

// EXPECTED: 1 success, 1 failure
console.log('Successes:', successes.length); // Must be 1
console.log('Failures:', failures.length);   // Must be 1

const balance = await wallet.getBalance('user1');
console.log('Final balance:', balance); // Must be >= 0
```

---

## Dimension 5: Webhook Verification

**Risk Level: LOW**

### Findings

All three gateways implement cryptographic verification with **timing-safe comparison**:

| Gateway | Algorithm | Timing-Safe | Raw Body Required | Timestamp Check | Tests |
|---------|-----------|-------------|-------------------|-----------------|-------|
| Midtrans | SHA-512 | `timingSafeEqual()` | No (field-based) | No | 6 |
| Xendit | Token equality | `timingSafeEqual()` | N/A | No | 5 |
| Stripe | HMAC-SHA256 | `timingSafeEqual()` | Yes (enforced) | Yes (5 min) | 8 |

### Architecture Guarantee: Verification Cannot Be Bypassed

The `handleWebhook()` function in `checkout.ts` enforces verification BEFORE parsing:

```typescript
// checkout.ts:48-51
const valid = await gateway.verifyWebhook(params.payload, params.signature, params.rawBody);
if (!valid) {
  throw new WebhookVerificationError();
}
const parsed = gateway.parseWebhookPayload(params.payload); // Only reached after verification
```

`parseWebhookPayload` is NOT exported publicly — it's only callable through `handleWebhook()`. A developer cannot accidentally call it without verification.

### Xendit Caveat

Xendit uses a **static callback token** (not HMAC of payload). The payload is NOT cryptographically bound to the signature. This matches Xendit's API spec but provides weaker assurance than HMAC — an attacker with the callback token can forge arbitrary payloads. The token must be protected via HTTPS.

### Verification Test

```typescript
// Test: Can a webhook be processed without valid signature?
try {
  await checkoutManager.handleWebhook({
    payload: { order_id: 'order-1', status_code: '200', gross_amount: '100000' },
    signature: 'forged-signature-value',
  });
  console.log('BUG: Webhook processed without valid signature!');
} catch (err) {
  console.log('PASS: WebhookVerificationError thrown'); // Expected
}
```

---

## Dimension 6: Token/Credit Expiration Logic

**Risk Level: LOW**

### Findings

- Credits support optional `expiresAt` timestamps. FIFO consumption prioritizes earliest-expiring buckets.
- `expireCredits()` runs inside a transaction with `SELECT FOR UPDATE` on both the wallet row and expired bucket rows — **safe for concurrent execution**.
- Each expiration creates a debit entry with idempotency key `expire:${bucket.idempotencyKey}` — **idempotent and safe to retry**.
- Expired-but-not-yet-processed buckets are excluded from `spendableBalance` during `spend()` (checked via `gt(transactions.expiresAt, new Date())`).
- **No built-in scheduler** — the library provides `expireTokens(userId)` and `getUsersWithExpirableCredits(now)` as building blocks. The application is responsible for scheduling.

### Double-Spend via Expiration Race

Not possible. The `spend()` path locks FIFO buckets with `FOR UPDATE` and filters out expired buckets. The `expireCredits()` path also locks buckets with `FOR UPDATE`. PostgreSQL serializes these — one will wait for the other.

### Verification Test

```typescript
// Test: Concurrent spend and expire on same bucket
await wallet.topUp('user1', 100, 'top-1', { expiresAt: new Date(Date.now() + 1000) });
await new Promise(r => setTimeout(r, 1100)); // Wait for expiration

const results = await Promise.allSettled([
  wallet.spend('user1', 50, 'spend-1'),      // Should fail (expired)
  wallet.expireTokens('user1'),               // Should succeed
]);
// Verify no double-debit occurred
```

---

## Dimension 7: Dependency & Supply Chain Risk

**Risk Level: LOW**

### Runtime Dependency Count

| Package | Runtime Deps | Transitive Deps |
|---------|-------------|-----------------|
| `@murai-wallet/core` | **0** | **0** |
| `@murai-wallet/gateway-midtrans` | 1 (core) | **0** |
| `@murai-wallet/gateway-xendit` | 1 (core) | **0** |
| `@murai-wallet/gateway-stripe` | 1 (core) | **0** |
| `@murai-wallet/storage-drizzle` | 1 peer (drizzle-orm) | User-controlled |

**Zero external npm runtime dependencies in core.** All gateway adapters use only Node.js built-in `crypto` module. This is exceptional for supply chain security.

### Maintenance

- Monorepo uses Turborepo + pnpm workspaces + Changesets for versioning
- Biome for linting/formatting (strict: `any` banned, `delete` banned)
- TypeScript strict mode with `exactOptionalPropertyTypes`
- Lefthook pre-commit: biome lint + turbo typecheck
- 98+ unit tests across packages

### Concerns

- **Drizzle ORM peer dependency** uses `>=0.30.0` without upper bound — recommend `>=0.30.0 <1.0.0`
- No automated dependency scanning (Dependabot/Renovate) visible in config

### Verification Test

```bash
# Count transitive dependencies
cd packages/core && npm ls --all --prod 2>/dev/null | wc -l
```

---

## Dimension 8: Error Handling & Information Leakage

**Risk Level: MEDIUM**

### Findings

| Error Class | Leaks | Severity |
|-------------|-------|----------|
| `InsufficientBalanceError` | userId, requested amount, available balance | HIGH |
| `IdempotencyConflictError` | idempotency key value | MEDIUM |
| `GatewayError` | raw gateway API response text | HIGH |
| `InvalidExpirationError` | exact timestamp | LOW |
| `WebhookVerificationError` | nothing (generic message) | SAFE |
| `InvalidAmountError` | amount value | LOW |
| `InvalidMetadataError` | reason string | SAFE |

### Specific Concerns

**`InsufficientBalanceError`** includes the exact user balance in the error message:
```
"Insufficient balance for user user123: requested 5000, available 2000"
```
If this propagates to an API response, it reveals the user's exact balance to an attacker probing spend amounts.

**`GatewayError`** includes unfiltered `await res.text()` from payment gateway APIs. Gateway error responses may contain internal server details, rate limit thresholds, or partial credential echoes.

### Verification Test

```typescript
try {
  await wallet.spend('user-1', 999999, 'probe-key');
} catch (err) {
  console.log(err.message);    // "Insufficient balance for user user-1: requested 999999, available 500"
  console.log(err.available);  // 500 — exact balance leaked
}
```

---

## Dimension 9: PCI-DSS / OJK Compliance Relevance

**Risk Level: MEDIUM (Organizational, Not Code)**

### Findings

Murai is a **credit/token wallet**, not a payment card processor. It does not store, process, or transmit cardholder data (PAN, CVV, expiry). Payment card data is handled entirely by the payment gateways (Midtrans, Xendit, Stripe) via hosted checkout pages (redirect model).

### Compliance Obligations

| Regulation | Applicability | Notes |
|-----------|---------------|-------|
| **PCI-DSS** | SAQ A (redirect) | No cardholder data touches your server. Gateway-hosted checkout. Minimal PCI scope. |
| **OJK (Indonesia)** | Potentially applicable | If operating as e-money or stored-value facility, OJK POJK 20/2019 on digital payment may apply. Requires licensing as payment system provider. |
| **BI (Bank Indonesia)** | Potentially applicable | BI Regulation 23/2021 on payment systems — stored-value operations may require BI registration. |
| **PDP Law (Indonesia)** | Applicable | UU 27/2022 requires protection of personal data. userId, transaction history, and balances are personal data. |

### Key Compliance Gaps

1. **Audit logging:** Append-only ledger provides a good audit trail but lacks structured logging with IP addresses, actor identity, or change reasons.
2. **Data retention:** No built-in data retention/deletion policies. PDP Law requires data minimization.
3. **Access control:** No RBAC, no admin/user separation, no MFA. The library assumes the caller handles authorization.
4. **Reporting:** No built-in reconciliation or regulatory reporting exports.

### Verification Action

Consult with Indonesian fintech legal counsel on whether your specific use case (SaaS credit system vs. e-money) triggers OJK/BI licensing requirements. The distinction often depends on whether credits are redeemable for cash.

---

## Dimension 10: Missing Security Controls

**Risk Level: HIGH (Must Build on Top)**

The following critical security features are **NOT provided** by Murai and must be implemented at the application layer:

| Control | Status | Priority |
|---------|--------|----------|
| **Rate limiting** (spend, topUp, webhook endpoints) | NOT PROVIDED | Critical |
| **Authentication & Authorization** (who can spend from whose wallet) | NOT PROVIDED | Critical |
| **Audit logging** (structured logs with actor, IP, timestamp) | NOT PROVIDED | High |
| **Fraud detection hooks** (velocity checks, anomaly detection) | NOT PROVIDED | High |
| **MFA for large transactions** | NOT PROVIDED | High |
| **IP allowlisting for webhooks** | NOT PROVIDED | Medium |
| **Balance change notifications** | NOT PROVIDED | Medium |
| **Transaction amount limits** (per-tx, daily, monthly) | NOT PROVIDED | Medium |
| **Account lockout / freeze** | NOT PROVIDED | Medium |
| **Reconciliation tools** | NOT PROVIDED | Low |

### Design Intent

Murai is explicitly designed as a **low-level library**, not a full payment platform. The absence of these controls is by design — the library provides the wallet primitives, and the application provides the security envelope. This is a reasonable architectural decision but must be clearly understood by adopters.

### Verification Test

```typescript
// Test: Can any caller spend from any wallet without authorization?
// Murai has no built-in authz — the answer is YES.
await wallet.spend('any-user-id', 100, 'key'); // No auth check — succeeds if balance exists
```

---

## Top 3 Residual Risks to Mitigate

### 1. TOCTOU Race Condition in `spend()` (CRITICAL)

**File:** `packages/core/src/wallet.ts:72-76`

The wallet-layer balance pre-check is outside the database transaction. While the Drizzle storage adapter's internal re-check under lock currently prevents actual overdraft, this is an **implementation detail** — a custom storage adapter could be vulnerable. The pre-check should either be removed (let the storage layer handle it) or documented as advisory-only.

**Required action:** Remove the unlocked pre-check OR document it as advisory-only and add an integration test proving concurrent spend safety.

### 2. Error Message Information Leakage (HIGH)

`InsufficientBalanceError` and `GatewayError` leak sensitive data (user balances, raw gateway responses) in error messages. If these propagate to API responses, attackers gain reconnaissance information.

**Required action:** Sanitize error messages to be generic. Keep sensitive data on error object properties for programmatic access only. Document that `GatewayError.gatewayMessage` must never be exposed to end users.

### 3. No Application-Layer Security Controls (HIGH)

Murai provides zero authentication, authorization, rate limiting, or fraud detection. Every production deployment MUST implement these on top.

**Required action:** Document minimum security requirements for production use. Consider providing middleware hooks or an `onBeforeSpend` / `onAfterSpend` callback pattern for integrating fraud detection.

---

## Minimum Required Changes Before Production Use

| # | Change | Severity | Effort |
|---|--------|----------|--------|
| 1 | Add concurrent `spend()` integration test proving no overdraft | Critical | 1 hour |
| 2 | Remove or guard the unlocked balance pre-check in `wallet.ts:72` | Critical | 30 min |
| 3 | Sanitize `GatewayError.gatewayMessage` — don't pass raw `res.text()` | High | 1 hour |
| 4 | Sanitize `InsufficientBalanceError` message — don't include balance | High | 15 min |
| 5 | Wrap all wallet operations with authentication/authorization in your app | Critical | App-specific |
| 6 | Add rate limiting to webhook endpoints and spend/topUp routes | Critical | App-specific |
| 7 | Add structured audit logging around wallet operations | High | App-specific |
| 8 | Cap Drizzle ORM peer dependency to `<1.0.0` | Low | 5 min |

---

## Positive Security Findings

These aspects are well-designed and production-worthy:

- **Append-only ledger** — immutable transaction history, excellent for audit trails
- **Zero runtime dependencies** in core — exceptional supply chain hygiene
- **Timing-safe webhook verification** across all 3 gateways with `crypto.timingSafeEqual()`
- **Verification-before-parsing architecture** — developers cannot accidentally skip webhook verification
- **FIFO bucket expiration** with idempotent, transactional, locked operations
- **Drizzle ORM parameterized queries** — zero SQL injection surface
- **Functional DI pattern** — credentials scoped to closures, never serialized
- **Typed error hierarchy** — enables programmatic error handling without string parsing
- **No console logging** — zero risk of accidental credential/data leakage to stdout
- **`SELECT FOR UPDATE`** row-level locking on all balance mutations
- **Database-level UNIQUE constraint** as final idempotency guard

---

## Scope Limitations

This audit covers the murai library code only. It does **not** cover:

- The security of the underlying database deployment (network access, TLS, credentials)
- The security of the payment gateway accounts (API key rotation, IP allowlisting)
- The application code that integrates murai (input sanitization, authentication, authorization)
- Infrastructure concerns (DDoS, rate limiting, logging/monitoring)

Integrators are responsible for securing their own deployment environment.
