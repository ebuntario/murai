# Contributing to Murai

## Setup

```bash
git clone https://github.com/ebuntario/murai.git
cd murai
pnpm install
pnpm build
pnpm test
```

Requires Node.js >= 22 and pnpm >= 10.

## Development Workflow

1. Write a failing test first (`__tests__/*.test.ts` alongside source)
2. Confirm it fails — `pnpm --filter <pkg> test`
3. Write the minimum code to pass
4. Run all checks — `pnpm lint && pnpm typecheck && pnpm test`

## Conventions

- **Functional DI** — factory functions with injected dependencies, no class hierarchies
- **Every exported function needs a test**
- **Domain errors** extend `MuraiError` with a typed `code` string
- **No `any`** — Biome enforces this as an error
- **Tabs** for indentation, line width 100
- **Append-only ledger** — never update or delete transaction entries

## Integration Tests

Storage integration tests run against a real PostgreSQL database (e.g. Neon):

```bash
DATABASE_URL=postgres://user:pass@host/db pnpm --filter @murai-wallet/storage-drizzle test
```

Without `DATABASE_URL`, integration tests are automatically skipped.

## PR Checklist

- [ ] Tests pass: `pnpm test`
- [ ] Types check: `pnpm typecheck`
- [ ] Lint passes: `pnpm lint`
- [ ] New exports have corresponding tests
- [ ] No `any` types introduced
- [ ] Changeset added if user-facing: `pnpm changeset`
