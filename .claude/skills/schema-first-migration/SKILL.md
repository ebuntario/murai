---
name: schema-first-migration
description: "Step-by-step guide for Drizzle ORM data migrations in the murai monorepo: update schema → inspect diff → generate migration file → review SQL → apply safely."
license: MIT
---

# Data Migration

## Overview

This skill guides you through the full data migration workflow for the `@murai/storage-drizzle` package using Drizzle ORM. Always follow these steps in order — skipping steps risks data loss or drift between schema and database.

---

## Step 1 — Update the Schema

Edit the Drizzle schema file(s) in `packages/storage-drizzle/src/`:

- Add new tables, columns, or indexes
- Modify existing column types or constraints
- Remove deprecated tables/columns

**Rules to follow:**

- Never delete or modify existing migration files — only add new ones
- For the ledger table, honor the append-only invariant: no `UPDATE`/`DELETE` in migrations
- All new columns on the `ledger_entries` table must be `NOT NULL` or have a safe default
- Use `text` (not `varchar`) for string IDs — this matches the `StorageAdapter` interface in `packages/core/src/types.ts`
- Enforce idempotency: any new unique constraint must cover `idempotency_key`

**Example schema additions (`packages/storage-drizzle/src/schema.ts`):**

```ts
import { pgTable, text, numeric, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const ledgerEntries = pgTable(
  'ledger_entries',
  {
    id:             text('id').primaryKey(),
    userId:         text('user_id').notNull(),
    amount:         numeric('amount', { precision: 18, scale: 6 }).notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idempotencyIdx: uniqueIndex('ledger_entries_idempotency_key_idx').on(t.idempotencyKey),
  }),
);
```

After editing, run a typecheck to catch errors early:

```bash
pnpm --filter @murai/storage-drizzle typecheck
```

---

## Step 2 — Inspect the Diff

Before generating a migration, preview what Drizzle will produce:

```bash
# Show pending schema changes (dry run)
pnpm --filter @murai/storage-drizzle exec drizzle-kit diff
```

Or if using the project's drizzle config:

```bash
npx drizzle-kit diff --config=packages/storage-drizzle/drizzle.config.ts
```

**Checklist — verify the diff:**

- [ ] Only expected tables/columns are listed
- [ ] No accidental `DROP TABLE` or `DROP COLUMN` for in-use tables
- [ ] Ledger entries table has no `UPDATE`/`DELETE` statements
- [ ] New `NOT NULL` columns on existing tables include a `DEFAULT` or a two-phase migration
- [ ] Column renames are done as `ADD COLUMN` → backfill → `DROP COLUMN`, not a direct rename

**Red flags — stop and fix before proceeding:**

- Unexpected `DROP` statements → check for typos in column/table names
- Missing idempotency unique constraint → every write path needs it
- `ALTER COLUMN ... TYPE` without a safe cast → may require `USING` clause

---

## Step 3 — Generate the Migration File

```bash
pnpm --filter @murai/storage-drizzle exec drizzle-kit generate
```

Or via the config:

```bash
npx drizzle-kit generate --config=packages/storage-drizzle/drizzle.config.ts
```

This writes a new SQL file to `packages/storage-drizzle/migrations/` with a timestamped name like `0001_add_checkout_sessions.sql`.

**Never:**
- Edit generated SQL files directly (re-generate instead)
- Delete or rename existing migration files
- Reorder migration files

---

## Step 4 — Review the Generated SQL

Read the newly created `.sql` file carefully:

```bash
# Read and verify the generated migration
cat packages/storage-drizzle/migrations/<new-file>.sql
```

**Required checks:**

1. **`CREATE TABLE`** — confirm column types match the TypeScript schema
2. **`CREATE UNIQUE INDEX`** — idempotency keys must have unique indexes
3. **No `DROP`** on production-critical tables without explicit user approval
4. **`NOT NULL` on new columns** — existing rows need a `DEFAULT` to avoid migration failure
5. **Backward compatibility** — the previous deployed version of the app must still work while migration is in progress (zero-downtime requirement)

**Two-phase pattern for adding a `NOT NULL` column to a live table:**

```sql
-- Phase 1 (deploy first, then run)
ALTER TABLE ledger_entries ADD COLUMN metadata jsonb;

-- Phase 2 (after backfill, deploy new code that requires it)
ALTER TABLE ledger_entries ALTER COLUMN metadata SET NOT NULL;
```

Generate two separate migration files for each phase.

---

## Step 5 — Apply the Migration

**Development / test environment:**

```bash
pnpm --filter @murai/storage-drizzle exec drizzle-kit migrate
```

**Production — checklist before running:**

- [ ] Migration reviewed and approved (step 4)
- [ ] Database backup taken
- [ ] Migration tested against a staging environment with production-like data volume
- [ ] Rollback plan documented (manual reversal SQL prepared)
- [ ] Maintenance window or zero-downtime strategy confirmed

---

## Step 6 — Verify and Run Tests

After applying:

```bash
pnpm --filter @murai/storage-drizzle test
pnpm --filter @murai/storage-drizzle typecheck
pnpm lint
```

Confirm:
- [ ] All tests pass (`failed=0`)
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] Application can read and write to migrated tables

---

## Common Scenarios

### Adding a new table

1. Define table in `schema.ts`
2. `drizzle-kit diff` → verify only `CREATE TABLE`
3. `drizzle-kit generate` → review SQL
4. `drizzle-kit migrate`
5. Run tests

### Adding a nullable column

1. Add column with `.notNull(false)` (or omit `.notNull()`)
2. Generate and apply migration
3. Backfill data if needed
4. Later: add `NOT NULL` constraint in a follow-up migration

### Renaming a column (zero-downtime)

Never use `RENAME COLUMN` in a live system. Instead:

1. Migration 1: `ADD COLUMN new_name ...` — copy data: `UPDATE ... SET new_name = old_name`
2. Deploy new code that writes to both columns
3. Migration 2: mark `old_name` as deprecated, stop reading it
4. Migration 3: `DROP COLUMN old_name`

### Backfilling existing rows

```sql
-- Safe batch backfill (prevents table lock on large datasets)
UPDATE ledger_entries
SET    new_column = compute_value(old_column)
WHERE  new_column IS NULL
LIMIT  1000;
-- Repeat until 0 rows updated
```

---

## Project Invariants (never violate)

| Rule | Reason |
|------|--------|
| Ledger entries are append-only | Core accounting correctness — no `UPDATE`/`DELETE` |
| `idempotency_key` must be unique | Prevents duplicate charges on retry |
| `SELECT FOR UPDATE` on balance reads | Prevents race conditions during concurrent spend |
| No `any` in schema TypeScript | Biome enforces this as an error |
| Never modify existing migration files | Reproducible migration history |

---

## Reference Commands

```bash
# Typecheck storage package
pnpm --filter @murai/storage-drizzle typecheck

# Run storage tests
pnpm --filter @murai/storage-drizzle test

# Preview schema changes (dry run)
npx drizzle-kit diff --config=packages/storage-drizzle/drizzle.config.ts

# Generate migration file
npx drizzle-kit generate --config=packages/storage-drizzle/drizzle.config.ts

# Apply pending migrations
npx drizzle-kit migrate --config=packages/storage-drizzle/drizzle.config.ts

# Full project checks
pnpm lint && pnpm typecheck && pnpm test
```
