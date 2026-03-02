# Murai - Design Review Memory

## Architecture
- Monorepo: pnpm workspaces + Turborepo + tsup + Biome + Vitest
- Functional DI pattern (factory functions, not classes)
- Core exports: wallet.ts, ledger.ts, checkout.ts, errors.ts, types.ts (NO schemas.ts - file does not exist despite CLAUDE.md claiming it)
- Node >=22, ESM-first with CJS fallback
- pnpm-workspace.yaml already includes `examples/*` glob

## Key Files
- `/packages/core/src/types.ts` - StorageAdapter, PaymentGatewayAdapter, Wallet, CheckoutSession interfaces
- `/packages/core/src/ledger.ts` - createLedger() with credit/debit, idempotency check BEFORE appendEntry (TOCTOU)
- `/packages/core/src/wallet.ts` - createWallet() with optimistic balance check in spend() (TOCTOU)
- `/packages/core/src/checkout.ts` - createCheckoutManager() with handleWebhook, returns WebhookResult
- `/packages/core/src/errors.ts` - MuraiError hierarchy (5 error classes)
- `/packages/core/src/__tests__/helpers.ts` - createMockStorage() in-memory StorageAdapter (NOT publicly exported)
- `/packages/storage-drizzle/src/index.ts` - Drizzle PG impl with SELECT FOR UPDATE, BIGINT, atomic appendEntry
- `/packages/gateway-midtrans/src/index.ts` - Midtrans Snap, SHA512 timing-safe verify, dual hosts
- `/packages/gateway-xendit/src/index.ts` - Xendit Checkout, timingSafeEqual callback token

## Critical Design Observations
- CLAUDE.md lists `schemas.ts` with "Zod validation schemas" but the file does not exist
- CheckoutSession type in core MISSING `updatedAt` but Drizzle schema HAS it - type discrepancy
- Library never published to npm - all at 0.0.1 with workspace:* deps
- Public API surface is small: 6 factory functions, ~10 types, 5 error classes
- ledger.ts TOCTOU race: findEntry() then appendEntry() separate calls
- wallet.ts spend() TOCTOU race: getBalance() then debit() separate calls
- checkout.ts handleWebhook uses `webhook:{orderId}` idempotency key pattern

## v0.2.0 Review Key Findings
- Xendit getPaymentStatus uses invoice_id not external_id
- StorageAdapter breaking change: 2 new required methods breaks custom adapters
- Neon MCP for tests = cloud dependency for local dev
- WebhookAction missing 'failed' for non-success webhook scenarios

## v0.3.0 Review Key Findings
- Examples workspace vs standalone conflict (pnpm-workspace.yaml includes examples/* but plan says standalone)
- No mechanism for keeping doc code examples in sync with source
- Two example apps doubles maintenance for marginal value over one + doc snippets
- Quickstart page undefined - no outline of prerequisites or end state
- 6 API reference pages over-engineered for current API surface size
- Open questions (deployment, auto-gen docs, DB setup, domain) are blocking decisions left unresolved
- In-memory storage mock in test helpers not publicly exported - blocks frictionless quickstart
- Biome cannot lint .astro or .mdx files - docs workspace will be lint-free zone

## v0.4.0 Review Key Findings
- CRITICAL: getEffectiveBalance vs materialized wallets.balance creates dual source of truth
- CRITICAL: expireTokens race condition with concurrent spend() - needs atomic StorageAdapter method
- CRITICAL: No mechanism to track which credits have been expired (N+1 or requires ledger mutation)
- CRITICAL: appendEntry silently drops expiresAt/metadata for adapters that don't support them
- CRITICAL: MarginReport "revenue" conflates token top-ups with actual revenue - economically meaningless
- CRITICAL: Stripe verifyWebhook needs raw body bytes, PaymentGatewayAdapter only passes parsed payload
- Partial credit expiration undefined - what if 1000 tokens credited, 300 spent, credit expires?
- No FIFO expiration ordering for credit consumption
- expireTokens is per-user only - no batch/global API for cron jobs
- getTransactionsByDateRange should extend existing TransactionQuery, not be a separate method
- Stripe uses Bearer auth, not Basic auth like Midtrans/Xendit
- Stripe cancel_url != failure redirect - different semantics
- metadata as unvalidated string with no size limit - needs schema + validation
- Ledger interface (exported) must be updated for expiresAt/metadata but plan doesn't show it

## v1.0.0 Review Key Findings
- TOCTOU races in spend() and ledger idempotency STILL not fixed at v1.0 planning stage
- getUsageReport silently capped at 100 txns with hardcoded limit - data correctness bug
- All packages at 0.0.1 - never published to npm - version history in CHANGELOG is narrative only
- WebhookAction still missing 'failed' (flagged in v0.2.0 review, never addressed)
- CheckoutSession still missing updatedAt (flagged in v0.4.0 review, never addressed)
- CLAUDE.md still references deleted schemas.ts (flagged in v0.2.0 review, never fixed)
- Changesets config: linked=[], fixed=[], updateInternalDependencies=patch, access=public
- release.yml uses changesets/action - creates Release PR, then publishes on merge
- expireTokens/getCheckouts/getTransactions throw bare Error, not MuraiError
- InvalidAmountError reused for pagination validation (semantic mismatch)
- murai meta-package description/keywords don't mention Stripe
- CHANGELOG.md is in .gitignore - needs git add -f
- Benchmark files at monorepo root won't work without Turborepo bench task + vitest bench config
- In-memory mock not exported - benchmarks can't import without fragile relative paths
- 7 error classes now (added InvalidExpirationError, InvalidMetadataError in v0.4.0)

## OSS Adoption Readiness Review Key Findings
- CRITICAL: meta-package `export *` with optional peerDeps crashes at runtime (ERR_MODULE_NOT_FOUND)
- CRITICAL: `changeset publish --provenance` is NOT a valid flag - use NPM_CONFIG_PROVENANCE=true
- CRITICAL: workflow_run trigger creates race with concurrent pushes - use branch protection instead
- CRITICAL: Plan modifies .github/ which is protected by CLAUDE.md
- No LICENSE file in sub-package dirs - npm pack won't include root LICENSE
- @changesets/changelog-github needs install + repo field in config
- publint/attw as npx = version drift + cold cache penalty; pin as devDeps
- Node 20 EOL April 2026 - lowering engines is questionable
- First npm publish cannot use provenance (bootstrap sequence)
- All packages at 1.0.0 now but never published
- tsup.config.ts identical across all 6 packages - no external config anywhere

## Patterns & Conventions
- Error codes: SCREAMING_SNAKE_CASE on readonly `code` field
- All mutations require idempotencyKey
- Amount: positive integer (validated in ledger, not wallet)
- Protected files: biome.json, turbo.json, .github/, .claude/hooks/
- Biome: tabs (2 width), lineWidth 100, `any` banned
- Pre-commit: biome check + turbo typecheck (lefthook)
- CI: lint, typecheck, build, test (no docs build step currently)
- pnpm-workspace.yaml: packages/*, apps/*, docs (no examples/*)
- Vitest bench available (v3.2.4) but not configured in vitest.config.ts
- No external config in any tsup.config.ts - relies on auto-externalization
- All packages at version 1.0.0 but never published to npm

## Security Audit Review Key Findings
- Existing concurrent debit test in integration.test.ts (line 96) proves storage-layer safety already
- wallet.ts spend() pre-check is redundant but NOT exploitable with Drizzle adapter (appendEntry rechecks under lock)
- ledger.ts findEntry() TOCTOU is also redundant - DB UNIQUE constraint is final arbiter
- The wallet-layer TOCTOU is a UX problem (stale error message), not a security problem
- InsufficientBalanceError leaks exact balance in .message AND .available property
- GatewayError.gatewayMessage contains raw res.text() from all 3 gateways (6 throw sites)
- Idempotency keys are globally scoped (UNIQUE on idempotency_key alone, not per-user)
- getUsageReport hardcoded limit:100 still present - produces incorrect reports for active users
- Integration test table creation (integration.test.ts) missing expires_at, remaining, expired_at, metadata columns
- Xendit sandbox/production use same base URL (api.xendit.co) - sandbox flag is a no-op
- Packages now at 1.0.3 (storage-drizzle per package.json)
