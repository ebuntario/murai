// @token-wallet/storage-drizzle
// Drizzle ORM storage adapter — PostgreSQL (postgres.js or node-postgres)
// Peer dependency: drizzle-orm >=0.30.0

import { randomUUID } from 'node:crypto';
import { IdempotencyConflictError, InsufficientBalanceError } from '@token-wallet/core';
import type {
	CheckoutQuery,
	CheckoutSession,
	LedgerEntry,
	StorageAdapter,
	TransactionQuery,
} from '@token-wallet/core';
import { and, desc, eq, gt, lt } from 'drizzle-orm';
import {
	type PgDatabase,
	type PgQueryResultHKT,
	bigint,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Schema — BIGINT for money (IDR amounts can exceed INT max ~2.1B)
// ---------------------------------------------------------------------------

const wallets = pgTable('wallets', {
	userId: text('user_id').primaryKey(),
	balance: bigint('balance', { mode: 'number' }).notNull().default(0),
});

const transactions = pgTable('transactions', {
	id: uuid('id').primaryKey(),
	userId: text('user_id').notNull(),
	amount: bigint('amount', { mode: 'number' }).notNull(),
	idempotencyKey: text('idempotency_key').notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

const checkouts = pgTable('checkouts', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	amount: bigint('amount', { mode: 'number' }).notNull(),
	redirectUrl: text('redirect_url').notNull(),
	status: text('status').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** PostgreSQL unique constraint violation error code */
const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		(error as { code: unknown }).code === PG_UNIQUE_VIOLATION
	);
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a StorageAdapter backed by a Drizzle ORM PostgreSQL database.
 * Accepts any Drizzle PG database: PostgresJsDatabase or NodePgDatabase.
 *
 * @example
 * import { drizzle } from 'drizzle-orm/postgres-js';
 * import postgres from 'postgres';
 * const client = postgres(process.env.DATABASE_URL);
 * const db = drizzle(client);
 * const storage = createDrizzleStorage(db);
 */
export function createDrizzleStorage<HKT extends PgQueryResultHKT>(
	db: PgDatabase<HKT>,
): StorageAdapter {
	async function getBalance(userId: string): Promise<number> {
		const result = await db
			.select({ balance: wallets.balance })
			.from(wallets)
			.where(eq(wallets.userId, userId));
		return result[0]?.balance ?? 0;
	}

	async function appendEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry> {
		try {
			return await db.transaction(async (tx) => {
				// 1. Upsert wallet row (safe for concurrent first-writes)
				await tx.insert(wallets).values({ userId: entry.userId, balance: 0 }).onConflictDoNothing();

				// 2. Lock the wallet row exclusively before reading balance
				const walletRows = await tx
					.select()
					.from(wallets)
					.where(eq(wallets.userId, entry.userId))
					.for('update');

				const wallet = walletRows[0];
				if (!wallet) {
					throw new Error(`Wallet row missing for userId: ${entry.userId}`);
				}

				// 3. Guard for debit (negative amount)
				if (entry.amount < 0 && wallet.balance < Math.abs(entry.amount)) {
					throw new InsufficientBalanceError(entry.userId, Math.abs(entry.amount), wallet.balance);
				}

				// 4. Update balance atomically
				await tx
					.update(wallets)
					.set({ balance: wallet.balance + entry.amount })
					.where(eq(wallets.userId, entry.userId));

				// 5. Insert ledger entry — unique constraint enforces idempotency
				const [inserted] = await tx
					.insert(transactions)
					.values({
						id: randomUUID(),
						userId: entry.userId,
						amount: entry.amount,
						idempotencyKey: entry.idempotencyKey,
						createdAt: new Date(),
					})
					.returning();

				if (!inserted) {
					throw new Error('Failed to insert ledger entry');
				}

				return {
					id: inserted.id,
					userId: inserted.userId,
					amount: inserted.amount,
					idempotencyKey: inserted.idempotencyKey,
					createdAt: inserted.createdAt,
				};
			});
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw new IdempotencyConflictError(entry.idempotencyKey);
			}
			throw error;
		}
	}

	async function findEntry(idempotencyKey: string): Promise<LedgerEntry | null> {
		const result = await db
			.select()
			.from(transactions)
			.where(eq(transactions.idempotencyKey, idempotencyKey));
		const row = result[0];
		if (!row) return null;
		return {
			id: row.id,
			userId: row.userId,
			amount: row.amount,
			idempotencyKey: row.idempotencyKey,
			createdAt: row.createdAt,
		};
	}

	async function saveCheckout(session: CheckoutSession): Promise<CheckoutSession> {
		const [inserted] = await db
			.insert(checkouts)
			.values({
				id: session.id,
				userId: session.userId,
				amount: session.amount,
				redirectUrl: session.redirectUrl,
				status: session.status,
				createdAt: session.createdAt,
				updatedAt: new Date(),
			})
			.returning();

		if (!inserted) {
			throw new Error('Failed to insert checkout session');
		}

		return {
			id: inserted.id,
			userId: inserted.userId,
			amount: inserted.amount,
			redirectUrl: inserted.redirectUrl,
			status: inserted.status as CheckoutSession['status'],
			createdAt: inserted.createdAt,
		};
	}

	async function findCheckout(id: string): Promise<CheckoutSession | null> {
		const result = await db.select().from(checkouts).where(eq(checkouts.id, id));
		const row = result[0];
		if (!row) return null;
		return {
			id: row.id,
			userId: row.userId,
			amount: row.amount,
			redirectUrl: row.redirectUrl,
			status: row.status as CheckoutSession['status'],
			createdAt: row.createdAt,
		};
	}

	async function updateCheckoutStatus(
		id: string,
		status: CheckoutSession['status'],
	): Promise<void> {
		await db.update(checkouts).set({ status, updatedAt: new Date() }).where(eq(checkouts.id, id));
	}

	async function getTransactions(userId: string, query?: TransactionQuery): Promise<LedgerEntry[]> {
		const limit = query?.limit ?? 50;
		const offset = query?.offset ?? 0;

		const conditions = [eq(transactions.userId, userId)];
		if (query?.type === 'credit') {
			conditions.push(gt(transactions.amount, 0));
		} else if (query?.type === 'debit') {
			conditions.push(lt(transactions.amount, 0));
		}

		const rows = await db
			.select()
			.from(transactions)
			.where(and(...conditions))
			.orderBy(desc(transactions.createdAt))
			.limit(limit)
			.offset(offset);

		return rows.map((row) => ({
			id: row.id,
			userId: row.userId,
			amount: row.amount,
			idempotencyKey: row.idempotencyKey,
			createdAt: row.createdAt,
		}));
	}

	async function getCheckouts(userId: string, query?: CheckoutQuery): Promise<CheckoutSession[]> {
		const limit = query?.limit ?? 50;
		const offset = query?.offset ?? 0;

		const conditions = [eq(checkouts.userId, userId)];
		if (query?.status) {
			conditions.push(eq(checkouts.status, query.status));
		}

		const rows = await db
			.select()
			.from(checkouts)
			.where(and(...conditions))
			.orderBy(desc(checkouts.createdAt))
			.limit(limit)
			.offset(offset);

		return rows.map((row) => ({
			id: row.id,
			userId: row.userId,
			amount: row.amount,
			redirectUrl: row.redirectUrl,
			status: row.status as CheckoutSession['status'],
			createdAt: row.createdAt,
		}));
	}

	return {
		getBalance,
		appendEntry,
		findEntry,
		saveCheckout,
		findCheckout,
		updateCheckoutStatus,
		getTransactions,
		getCheckouts,
	};
}
