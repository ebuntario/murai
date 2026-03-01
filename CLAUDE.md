# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Murai is an open-source, lightweight, payment-gateway-agnostic token wallet library for AI/SaaS applications. It provides credit balance management with first-class support for Indonesian payment gateways (Midtrans Snap, Xendit Checkout).

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
pnpm --filter @murai/core build
pnpm --filter @murai/core test
pnpm --filter @murai/core typecheck
```

## Architecture

### Three core modules (`packages/core/src/`)

| File | Responsibility |
| --- | --- |
| `wallet.ts` | Public API: `getBalance`, `canSpend`, `spend`, `topUp` |
| `ledger.ts` | Append-only transaction log, double-entry accounting |
| `checkout.ts` | Payment gateway abstraction, webhook handling |
| `errors.ts` | Typed error hierarchy (`InsufficientBalanceError`, etc.) |
| `types.ts` | Public TypeScript interfaces |

### Monorepo packages

- `packages/core` — `@murai/core` — wallet, ledger, checkout, types
- `packages/gateway-midtrans` — `@murai/gateway-midtrans` — Midtrans Snap adapter
- `packages/gateway-xendit` — `@murai/gateway-xendit` — Xendit Checkout adapter
- `packages/storage-drizzle` — `@murai/storage-drizzle` — Drizzle ORM adapter (PostgreSQL primary)
- `packages/murai` — `murai` — convenience meta-package

### Key patterns

**Functional DI (not class hierarchies):**

```ts
export function createWallet(config: WalletConfig): Wallet {
  const storage = resolveStorage(config.storage, config.storageConfig);
  const ledger = createLedger(storage);
  return { getBalance: ..., spend: ..., topUp: ... };
}
```

**Typed domain errors:**

```ts
export class InsufficientBalanceError extends MuraiError { ... }
export class WebhookVerificationError extends MuraiError { ... }
export class IdempotencyConflictError extends MuraiError { ... }
```

**Critical invariants:** Append-only ledger (never update/delete transactions), row-level `SELECT FOR UPDATE` on balance operations, idempotency keys on all webhooks.

## Development Workflow

1. Write a failing test first (`__tests__/*.test.ts` alongside source)
2. Confirm it fails — `pnpm --filter <pkg> test`
3. Write the minimum code to pass
4. Run all checks — `pnpm lint && pnpm typecheck && pnpm test`

## Coding Rules

- Functional approach with injected dependencies — avoid deep class hierarchies
- Every new exported function requires a corresponding test
- Domain errors must extend `MuraiError` with a typed `code` string
- Never use `any` — Biome enforces this as an error
- Do not add dependencies without explicit approval
- Do not create new files when an existing file should be extended
- Do not modify `biome.json`, `turbo.json`, `.github/`, or `.claude/hooks/` — these are protected
