# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Murai is an open-source, lightweight, payment-gateway-agnostic token wallet library for AI/SaaS applications. It provides credit balance management with first-class support for Indonesian payment gateways (Midtrans Snap, Xendit Checkout) and Stripe.

## Commands

```bash
pnpm install              # Install all workspace dependencies
pnpm build                # Build all packages (Turborepo + tsup)
pnpm typecheck            # Type-check all packages
pnpm lint                 # Lint and format-check with Biome
pnpm format               # Auto-fix formatting and lint issues
pnpm test                 # Run Vitest across all packages
pnpm clean                # Remove all dist/ and .turbo/ caches
pnpm changeset            # Create a changeset for versioning
```

### Single package

```bash
pnpm --filter @murai-wallet/core build
pnpm --filter @murai-wallet/core test
pnpm --filter @murai-wallet/core typecheck
```

### Integration tests (requires PostgreSQL)

```bash
DATABASE_URL=<neon_url> pnpm --filter @murai-wallet/storage-drizzle test
```

Without `DATABASE_URL`, integration tests are automatically skipped.

## Architecture

### Core modules (`packages/core/src/`)

| File | Responsibility |
| --- | --- |
| `wallet.ts` | Public API: `getBalance`, `canSpend`, `spend`, `topUp`, `expireTokens`, `getUsageReport` |
| `ledger.ts` | Append-only transaction log, double-entry accounting |
| `checkout.ts` | Payment gateway abstraction, webhook handling (`createCheckoutManager`) |
| `errors.ts` | Typed error hierarchy — all extend `MuraiError` with a typed `code` string |
| `types.ts` | Public TypeScript interfaces (`Wallet`, `StorageAdapter`, `PaymentGatewayAdapter`, etc.) |

### Monorepo packages

- `packages/core` — `@murai-wallet/core` — wallet, ledger, checkout, types, errors
- `packages/gateway-midtrans` — `@murai-wallet/gateway-midtrans` — Midtrans Snap adapter
- `packages/gateway-xendit` — `@murai-wallet/gateway-xendit` — Xendit Checkout adapter
- `packages/gateway-stripe` — `@murai-wallet/gateway-stripe` — Stripe Checkout adapter
- `packages/storage-drizzle` — `@murai-wallet/storage-drizzle` — Drizzle ORM adapter (PostgreSQL, BIGINT for money)
- `packages/murai` — `murai` — convenience meta-package re-exporting all packages
- `docs/` — Starlight documentation site
- `examples/nextjs/` — Next.js example app

### Key patterns

**Functional DI (not class hierarchies):** Every module exports a `create*` factory function that accepts dependencies and returns a plain object of methods.

```ts
export function createWallet(config: WalletConfig): Wallet {
  const storage: StorageAdapter = config.storage;
  const ledger = createLedger(storage);
  return { getBalance, canSpend, spend, topUp, ... };
}
```

**FIFO credit buckets:** Credits can have `expiresAt` and `remaining` fields. Debits consume from earliest-expiring buckets first (NULLS LAST). The storage adapter handles this under `SELECT FOR UPDATE` locks.

**Sanitized error messages:** Error `.message` fields are generic (e.g. `"Insufficient balance"`). Sensitive details (userId, balance, gateway responses) are only on typed properties (`.userId`, `.available`, `.gatewayMessage`).

**Critical invariants:**
- Append-only ledger — never update/delete transaction entries
- Row-level `SELECT FOR UPDATE` on all balance mutations
- Idempotency keys on all webhook credits and wallet operations (globally scoped, not per-user)

## Development Workflow

1. Write a failing test first (`__tests__/*.test.ts` alongside source)
2. Confirm it fails — `pnpm --filter <pkg> test`
3. Write the minimum code to pass
4. Run all checks — `pnpm lint && pnpm typecheck && pnpm test`

Pre-commit hook (lefthook): runs `biome check --write` + `turbo typecheck`. Pre-push: runs `turbo test` + `biome ci`.

## Coding Rules

- Functional approach with injected dependencies — avoid deep class hierarchies
- Every new exported function requires a corresponding test
- Domain errors must extend `MuraiError` with a typed `code` string
- Never use `any` — Biome enforces this as an error (`noExplicitAny`)
- Biome formatting: tabs (2-width), lineWidth 100, single quotes, trailing commas
- Do not add dependencies without explicit approval
- Do not create new files when an existing file should be extended
- Do not modify `biome.json`, `turbo.json`, `.github/`, or `.claude/hooks/` — these are protected
- `docs/.astro/` is auto-generated — must be in `.gitignore`
