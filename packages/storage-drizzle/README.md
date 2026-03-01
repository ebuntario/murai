# @murai/storage-drizzle

Drizzle ORM storage adapter for [Murai](https://github.com/ebuntario/murai) — PostgreSQL with row-level locking.

## Install

```bash
npm install @murai/storage-drizzle @murai/core drizzle-orm postgres
```

## Usage

```typescript
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { createDrizzleStorage } from '@murai/storage-drizzle';

const sql = postgres(process.env.DATABASE_URL);
const storage = createDrizzleStorage(drizzle(sql));

// Use with createWallet from @murai/core
```

## Features

- PostgreSQL via `drizzle-orm/postgres-js`
- `SELECT FOR UPDATE` row-level locking for atomic balance operations
- BIGINT storage for precise monetary amounts
- Paginated transaction and checkout queries with filtering

## Documentation

Full docs: [ebuntario.github.io/murai](https://ebuntario.github.io/murai)

## License

[MIT](../../LICENSE)
