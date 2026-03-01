# Migration Guide

This guide covers upgrade paths between every version of murai.

---

## 0.1.x → 0.2.0

### Breaking: `handleWebhook` return type changed

`handleWebhook` previously returned `Promise<void>`. It now returns `Promise<WebhookResult>` with structured action information.

**Before (0.1.x):**

```ts
await checkout.handleWebhook({
  gateway,
  payload: body,
  signature: sig,
});
// No return value — caller had no insight into what happened
res.status(200).end();
```

**After (0.2.0+):**

```ts
const result = await checkout.handleWebhook({
  gateway,
  payload: body,
  signature: sig,
});
// result.action is 'credited' | 'skipped' | 'duplicate'
// result.reason provides context (e.g., 'non_success_status', 'already_processed')
res.status(200).json(result);
```

### Removed: `schemas.ts`

The `schemas.ts` file (unused type aliases) was removed from `@murai/core`. If you imported from it directly, remove those imports — the types are available from `types.ts`.

### New features (non-breaking)

- **Xendit gateway** — `@murai/gateway-xendit` is now available
- **Ledger query API** — `getTransactions()` and `getCheckouts()` with pagination
- **Midtrans improvements** — `getPaymentStatus()`, timing-safe verification, dual hosts, configurable timeout
- **Expired/failed webhook handling** — checkout status updated to `'failed'`

---

## 0.2.x → 0.3.0

**No breaking changes.**

### New features

- **Documentation site** — Starlight docs at `docs/`
- **Next.js example app** — `examples/nextjs/`
- **Pagefind search** in documentation

No code changes are required to upgrade.

---

## 0.3.x → 0.4.0

**No breaking changes.** All new fields and methods are optional and backward compatible.

### New features

- **Token expiration** — `topUp` accepts optional `expiresAt`; `expireTokens()` for cron-driven expiration
- **Usage reporting** — `getUsageReport(userId, { from, to })`
- **Metadata on spend/topUp** — optional `metadata` parameter (JSON string, <4KB)
- **Stripe gateway** — `@murai/gateway-stripe`
- **`rawBody` on `verifyWebhook`** — optional third parameter (required by Stripe, ignored by others)

### New optional interfaces

If you implement a custom `StorageAdapter`, the following methods are now available but optional:

- `expireCredits(userId)` — for token expiration support
- `getUsersWithExpirableCredits()` — for batch expiration jobs

No code changes are required to upgrade.

---

## 0.4.x → 1.0.0

**No breaking changes.** This release raises test coverage thresholds, adds a security audit document, performance benchmarks, and formalizes semantic versioning.

No code changes are required to upgrade.

---

## Summary

| Upgrade | Breaking changes | Action required |
| --- | --- | --- |
| 0.1 → 0.2 | `handleWebhook` return type, `schemas.ts` removed | Update webhook handler to use `WebhookResult` |
| 0.2 → 0.3 | None | None |
| 0.3 → 0.4 | None | None |
| 0.4 → 1.0 | None | None |
