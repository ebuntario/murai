# v0.4.0 Implementation Plan — Production Features

> **Goal:** Production-grade features that enterprise AI SaaS apps need before going live: token expiration, margin reporting, and Stripe support for global reach.

---

## Feature 1: Token Expiration

### Design

Credits can optionally expire. When a user tops up, the caller can attach an `expiresAt` timestamp. Balance queries and spends automatically exclude expired credits. A separate `expireTokens()` function writes expiration debit entries to the ledger, making cleanup explicit and auditable.

### Interface Changes

**`types.ts`** — Add `expiresAt` to `LedgerEntry` and new types:

```ts
export interface LedgerEntry {
  id: string;
  userId: string;
  amount: number;
  idempotencyKey: string;
  createdAt: Date;
  expiresAt?: Date;        // NEW — null means "never expires"
  metadata?: string;        // NEW — JSON string for margin reporting (Feature 2)
}
```

**`wallet.ts`** — Extend `topUp` and add `expireTokens`:

```ts
// topUp gains optional expiresAt
topUp(userId: string, amount: number, idempotencyKey: string, options?: { expiresAt?: Date }): Promise<void>;

// New: expire all credits past their expiresAt date, writing debit entries to the ledger
expireTokens(userId: string): Promise<{ expiredCount: number; expiredAmount: number }>;
```

**`StorageAdapter`** — Add required methods:

```ts
// New: returns sum of unexpired credits minus debits
getEffectiveBalance(userId: string, now: Date): Promise<number>;

// New: find all expired credit entries that haven't been offset yet
getExpiredCredits(userId: string, now: Date): Promise<LedgerEntry[]>;
```

### Implementation Steps

1. **`types.ts`** — Add `expiresAt?: Date` and `metadata?: string` to `LedgerEntry`. Add `expiresAt` to `appendEntry` param type. Add `expireTokens` to `Wallet` interface.
2. **`ledger.ts`** — Pass through `expiresAt` on `credit()` calls. No change to `debit()`.
3. **`wallet.ts`** — Add `options` param to `topUp`. Implement `expireTokens()` that:
   - Calls `storage.getExpiredCredits(userId, new Date())` to find un-offset expired credits
   - For each, writes a debit entry with idempotency key `expire:<original-idempotency-key>`
   - Returns count and total amount expired
4. **`wallet.ts`** — Update `getBalance` and `canSpend` to call `storage.getEffectiveBalance()` instead of `storage.getBalance()` when available (backward compatible).
5. **`storage-drizzle`** — Add `expires_at` column to `transactions` table. Implement `getEffectiveBalance` (SUM of amount WHERE expires_at IS NULL OR expires_at > NOW). Implement `getExpiredCredits`.
6. **Mock storage (`helpers.ts`)** — Add expiration support for unit tests.
7. **Tests** — `wallet.test.ts`:
   - `topUp` with `expiresAt` stores the expiration date
   - `getBalance` excludes expired credits
   - `canSpend` respects expiration
   - `expireTokens` creates debit entries for expired credits
   - `expireTokens` is idempotent (running twice doesn't double-debit)
   - `expireTokens` returns correct count and amount
   - Credits without `expiresAt` never expire

---

## Feature 2: Margin Reporting

### Design

When calling `spend()`, the caller can pass optional `metadata` (a JSON string recording the AI provider cost). A new `getMarginReport()` function aggregates revenue (credits) vs. cost (parsed from debit metadata) over a date range.

### Interface Changes

**`types.ts`**:

```ts
// spend gains optional metadata
spend(userId: string, amount: number, idempotencyKey: string, options?: { metadata?: string }): Promise<void>;

// New on Wallet interface
getMarginReport(userId: string, dateRange: { from: Date; to: Date }): Promise<MarginReport>;

// New type
export interface MarginReport {
  revenue: number;     // sum of credits in the date range
  cost: number;        // sum of `cost` fields parsed from debit metadata
  margin: number;      // revenue - cost
  transactionCount: number;
}
```

### Implementation Steps

1. **`types.ts`** — Add `metadata?: string` to `LedgerEntry` (already done in Feature 1). Add `MarginReport` interface. Add `getMarginReport` to `Wallet` interface. Add `options` to `spend` signature.
2. **`ledger.ts`** — Accept `metadata` in `debit()`. Pass through to `appendEntry`.
3. **`wallet.ts`** — Pass metadata from `spend()` through to `ledger.debit()`. Implement `getMarginReport()`:
   - Fetch all transactions in the date range
   - Sum credits as `revenue`
   - Parse `metadata` JSON on debits, extract `cost` field, sum as `cost`
   - Return `{ revenue, cost, margin: revenue - cost, transactionCount }`
4. **`StorageAdapter`** — Add `getTransactionsByDateRange(userId, from, to)` method (optional, with fallback to `getTransactions` with filtering).
5. **`storage-drizzle`** — Add `metadata` column to `transactions`. Implement `getTransactionsByDateRange` with SQL date filtering.
6. **Tests** — `wallet.test.ts`:
   - `spend` stores metadata
   - `getMarginReport` calculates revenue correctly
   - `getMarginReport` parses cost from metadata
   - `getMarginReport` returns zero margin for no transactions
   - `getMarginReport` handles debits without metadata (cost = 0)
   - Date range filtering works correctly

---

## Feature 3: Stripe Gateway Adapter

### Design

New package `@murai-wallet/gateway-stripe` following the exact same pattern as Midtrans and Xendit adapters. Implements `PaymentGatewayAdapter` interface.

### Package Structure

```text
packages/gateway-stripe/
  package.json
  tsconfig.json
  tsup.config.ts
  vitest.config.ts
  src/
    index.ts          # createStripeGateway factory + StripeConfig type
    __tests__/
      stripe.test.ts  # Unit tests (mocked fetch, no real Stripe calls)
```

### Interface

```ts
export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  /** Fetch timeout in ms — defaults to 30000 */
  timeoutMs?: number;
}

export function createStripeGateway(config: StripeConfig): PaymentGatewayAdapter & {
  getPaymentStatus(sessionId: string): Promise<WebhookStatus>;
};
```

### Implementation Steps

1. **Scaffold package** — Copy `gateway-midtrans` structure. Update `package.json` name/description. Add to `pnpm-workspace.yaml` if needed. Add `@murai-wallet/core` as peer dep.
2. **`index.ts`** — Implement:
   - `createCheckout` — POST to Stripe Checkout Sessions API (`/v1/checkout/sessions`), form-encoded. Returns `CheckoutSession` with redirect URL.
   - `verifyWebhook` — Stripe-Signature header parsing (`t=timestamp,v1=signature`), HMAC-SHA256 with `webhookSecret`, timing-safe comparison. Validates timestamp tolerance (5 minutes).
   - `parseWebhookPayload` — Parse `checkout.session.completed` events. Map Stripe statuses: `complete` → success, `expired` → expired, `open` → pending.
   - `getPaymentStatus` — GET `/v1/checkout/sessions/{id}`. Map payment_status to WebhookStatus.
3. **Tests** — `stripe.test.ts` (following Midtrans/Xendit pattern):
   - Webhook verification: valid signature, invalid signature, tampered payload, wrong secret, non-object payload, expired timestamp
   - Status mapping: all Stripe checkout statuses → WebhookStatus
   - createCheckout: mocked fetch, success and error paths
   - getPaymentStatus: mocked fetch, success and error paths
   - parseWebhookPayload: valid event, invalid event, wrong event type
4. **Meta-package** — Add `@murai-wallet/gateway-stripe` re-export to `murai/src/index.ts`.

---

## Feature 4: Documentation Updates

### New Pages

1. **`docs/src/content/docs/guides/token-expiration.mdx`** — Guide on token expiration:
   - When/why to use expiring credits
   - How to set `expiresAt` on topUp
   - Running `expireTokens()` via cron
   - How `getBalance` respects expiration
2. **`docs/src/content/docs/guides/margin-reporting.mdx`** — Guide on margin reporting:
   - Metadata convention for recording AI costs
   - Calling `getMarginReport()` and interpreting results
   - Example: tracking OpenAI API cost per spend
3. **`docs/src/content/docs/api-reference/gateway-stripe.mdx`** — Stripe adapter API reference
4. **`docs/src/content/docs/guides/choosing-a-gateway.mdx`** — Update to include Stripe comparison

### Existing Page Updates

1. **`api-reference/core.mdx`** — Document `expireTokens`, `getMarginReport`, new `options` params on `topUp` and `spend`
2. **`api-reference/types.mdx`** — Document `MarginReport`, updated `LedgerEntry` with `expiresAt` and `metadata`
3. **`api-reference/storage-drizzle.mdx`** — Document new schema columns and methods
4. **`getting-started/quickstart.mdx`** — Mention Stripe as an option
5. **`getting-started/installation.mdx`** — Add Stripe install instructions
6. **`index.mdx`** — Update feature list to mention token expiration, margin reporting, Stripe

### Code Examples

1. **`docs/src/examples/`** — Add typechecked examples for expiration, margin reporting, Stripe setup

### Other Documentation

1. **`CHANGELOG.md`** — Add v0.4.0 entry
2. **`ROADMAP.md`** — Check off v0.4.0 items
3. **`README.md`** — Update feature list and package table

---

## Implementation Order

1. **Types & interfaces first** — `types.ts` changes (expiresAt, metadata, MarginReport, new Wallet methods)
2. **Core logic** — `ledger.ts` and `wallet.ts` (expiration + margin)
3. **Mock storage** — Update `helpers.ts` for new fields
4. **Core tests** — Token expiration tests, margin reporting tests
5. **Storage adapter** — Drizzle schema changes + new methods
6. **Stripe adapter** — New package + tests
7. **Meta-package** — Re-export Stripe
8. **Documentation** — All new/updated pages
9. **Validation** — `pnpm lint && pnpm typecheck && pnpm test`

---

## Breaking Changes

This release has **one minor breaking change**:

- `LedgerEntry` gains two new optional fields (`expiresAt`, `metadata`). Existing `StorageAdapter` implementations that don't return these fields remain compatible (fields are optional).

The new `StorageAdapter` methods (`getEffectiveBalance`, `getExpiredCredits`, `getTransactionsByDateRange`) are **optional**. Core falls back to filtering in-memory when the storage adapter doesn't implement them.

---

## Risk Assessment

| Risk | Mitigation |
| ------ | ----------- |
| `getBalance` behavior change with expiration | Expiration-aware balance only activates when `getEffectiveBalance` is present on the storage adapter. Default behavior unchanged. |
| Stripe API key leakage in tests | All tests use mocked fetch. No real Stripe calls. |
| Schema migration complexity for Drizzle users | New columns are nullable (`expires_at`, `metadata`). No migration required for existing rows. |
| Margin report accuracy with partial metadata | Debits without metadata contribute 0 cost. Documented behavior. |
