// Integration tests for @murai-wallet/storage-drizzle against a real PostgreSQL database.
// Skipped if DATABASE_URL is not set.
// Run: DATABASE_URL=<neon_url> pnpm --filter @murai-wallet/storage-drizzle test

import { IdempotencyConflictError, InsufficientBalanceError } from '@murai-wallet/core';
import type { CheckoutSession, StorageAdapter } from '@murai-wallet/core';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

// @ts-expect-error — Biome requires dot notation but TS noPropertyAccessFromIndexSignature wants bracket; suppress TS
const DATABASE_URL: string | undefined = process.env.DATABASE_URL;

// Conditionally skip the entire suite
const describeIf = DATABASE_URL ? describe : describe.skip;

describeIf('storage-drizzle integration (PostgreSQL)', () => {
	// biome-ignore lint/suspicious/noExplicitAny: dynamic import types not available at compile time
	let sqlClient: any;
	let storage: StorageAdapter;

	beforeAll(async () => {
		// @ts-expect-error — postgres types not in devDeps; only runs when DATABASE_URL is set
		const { default: postgres } = await import('postgres');
		const { drizzle } = await import('drizzle-orm/postgres-js');
		const { createDrizzleStorage } = await import('../index.js');

		sqlClient = postgres(DATABASE_URL as string);
		const db = drizzle(sqlClient);
		// biome-ignore lint/suspicious/noExplicitAny: drizzle generic mismatch at compile time
		storage = createDrizzleStorage(db as any);

		// Create tables
		await sqlClient`
			CREATE TABLE IF NOT EXISTS wallets (
				user_id TEXT PRIMARY KEY,
				balance BIGINT NOT NULL DEFAULT 0
			)
		`;
		await sqlClient`
			CREATE TABLE IF NOT EXISTS transactions (
				id UUID PRIMARY KEY,
				user_id TEXT NOT NULL,
				amount BIGINT NOT NULL,
				idempotency_key TEXT NOT NULL UNIQUE,
				created_at TIMESTAMPTZ NOT NULL,
				expires_at TIMESTAMPTZ,
				remaining BIGINT,
				expired_at TIMESTAMPTZ,
				metadata TEXT
			)
		`;
		await sqlClient`
			CREATE TABLE IF NOT EXISTS checkouts (
				id TEXT PRIMARY KEY,
				user_id TEXT NOT NULL,
				amount BIGINT NOT NULL,
				redirect_url TEXT NOT NULL,
				status TEXT NOT NULL,
				created_at TIMESTAMPTZ NOT NULL,
				updated_at TIMESTAMPTZ NOT NULL
			)
		`;
	});

	afterEach(async () => {
		await sqlClient`TRUNCATE wallets, transactions, checkouts`;
	});

	afterAll(async () => {
		await sqlClient`DROP TABLE IF EXISTS transactions`;
		await sqlClient`DROP TABLE IF EXISTS checkouts`;
		await sqlClient`DROP TABLE IF EXISTS wallets`;
		await sqlClient.end();
	});

	it('credits and reads balance correctly', async () => {
		await storage.appendEntry({ userId: 'user1', amount: 100000, idempotencyKey: 'credit-1' });
		const balance = await storage.getBalance('user1');
		expect(balance).toBe(100000);
	});

	it('returns 0 for new user balance', async () => {
		const balance = await storage.getBalance('ghost-user');
		expect(balance).toBe(0);
	});

	it('throws InsufficientBalanceError on overdraft', async () => {
		await storage.appendEntry({ userId: 'user1', amount: 100, idempotencyKey: 'credit-1' });
		await expect(
			storage.appendEntry({ userId: 'user1', amount: -200, idempotencyKey: 'debit-1' }),
		).rejects.toThrow(InsufficientBalanceError);
	});

	it('throws IdempotencyConflictError on duplicate key', async () => {
		await storage.appendEntry({ userId: 'user1', amount: 100, idempotencyKey: 'dup-key' });
		await expect(
			storage.appendEntry({ userId: 'user1', amount: 100, idempotencyKey: 'dup-key' }),
		).rejects.toThrow(IdempotencyConflictError);
	});

	it('concurrent debits are serialized via SELECT FOR UPDATE', async () => {
		// Credit 100
		await storage.appendEntry({ userId: 'user1', amount: 100, idempotencyKey: 'credit-1' });

		// Two concurrent debits of 60 each — only one should succeed
		const debit1 = storage.appendEntry({
			userId: 'user1',
			amount: -60,
			idempotencyKey: 'debit-1',
		});
		const debit2 = storage.appendEntry({
			userId: 'user1',
			amount: -60,
			idempotencyKey: 'debit-2',
		});

		const results = await Promise.allSettled([debit1, debit2]);
		const successes = results.filter((r) => r.status === 'fulfilled');
		const failures = results.filter((r) => r.status === 'rejected');

		expect(successes).toHaveLength(1);
		expect(failures).toHaveLength(1);

		const balance = await storage.getBalance('user1');
		expect(balance).toBe(40);
	});

	it('checkout round-trip: save, find, update status', async () => {
		const session: CheckoutSession = {
			id: 'checkout-1',
			userId: 'user1',
			amount: 50000,
			redirectUrl: 'https://example.com/pay',
			status: 'pending',
			createdAt: new Date(),
		};

		await storage.saveCheckout(session);
		const found = await storage.findCheckout('checkout-1');
		expect(found).not.toBeNull();
		expect(found?.status).toBe('pending');
		expect(found?.amount).toBe(50000);

		await storage.updateCheckoutStatus('checkout-1', 'paid');
		const updated = await storage.findCheckout('checkout-1');
		expect(updated?.status).toBe('paid');
	});

	it('findCheckout returns null for unknown id', async () => {
		const found = await storage.findCheckout('nonexistent');
		expect(found).toBeNull();
	});

	it('findEntry returns null for unknown key', async () => {
		const found = await storage.findEntry('nonexistent');
		expect(found).toBeNull();
	});

	it('getTransactions returns paginated results', async () => {
		await storage.appendEntry({ userId: 'user1', amount: 100, idempotencyKey: 'c-1' });
		await storage.appendEntry({ userId: 'user1', amount: 200, idempotencyKey: 'c-2' });
		await storage.appendEntry({ userId: 'user1', amount: -50, idempotencyKey: 'd-1' });

		const all = await storage.getTransactions?.('user1', { limit: 10, offset: 0 });
		expect(all).toHaveLength(3);

		const page = await storage.getTransactions?.('user1', { limit: 2, offset: 0 });
		expect(page).toHaveLength(2);
	});

	it('getTransactions filters by type', async () => {
		await storage.appendEntry({ userId: 'user1', amount: 100, idempotencyKey: 'c-1' });
		await storage.appendEntry({ userId: 'user1', amount: 200, idempotencyKey: 'c-2' });
		await storage.appendEntry({ userId: 'user1', amount: -50, idempotencyKey: 'd-1' });

		const credits = await storage.getTransactions?.('user1', {
			limit: 10,
			offset: 0,
			type: 'credit',
		});
		expect(credits).toHaveLength(2);

		const debits = await storage.getTransactions?.('user1', {
			limit: 10,
			offset: 0,
			type: 'debit',
		});
		expect(debits).toHaveLength(1);
	});

	it('FIFO: earliest-expiring bucket consumed first', async () => {
		const later = new Date(Date.now() + 86400000);
		const soon = new Date(Date.now() + 3600000);

		await storage.appendEntry({
			userId: 'user1',
			amount: 500,
			idempotencyKey: 'top-later',
			expiresAt: later,
			remaining: 500,
		});
		await storage.appendEntry({
			userId: 'user1',
			amount: 300,
			idempotencyKey: 'top-soon',
			expiresAt: soon,
			remaining: 300,
		});

		await storage.appendEntry({ userId: 'user1', amount: -200, idempotencyKey: 'debit-1' });

		const soonEntry = await storage.findEntry('top-soon');
		const laterEntry = await storage.findEntry('top-later');
		expect(soonEntry?.remaining).toBe(100); // 300 - 200
		expect(laterEntry?.remaining).toBe(500); // untouched
	});

	it('FIFO: concurrent debits are serialized correctly', async () => {
		const future = new Date(Date.now() + 86400000);
		await storage.appendEntry({
			userId: 'user1',
			amount: 100,
			idempotencyKey: 'top-1',
			expiresAt: future,
			remaining: 100,
		});

		const debit1 = storage.appendEntry({
			userId: 'user1',
			amount: -60,
			idempotencyKey: 'debit-1',
		});
		const debit2 = storage.appendEntry({
			userId: 'user1',
			amount: -60,
			idempotencyKey: 'debit-2',
		});

		const results = await Promise.allSettled([debit1, debit2]);
		const successes = results.filter((r) => r.status === 'fulfilled');
		const failures = results.filter((r) => r.status === 'rejected');

		expect(successes).toHaveLength(1);
		expect(failures).toHaveLength(1);

		const balance = await storage.getBalance('user1');
		expect(balance).toBe(40);
	});

	it('expireCredits expires buckets and creates debit entries', async () => {
		const past = new Date(Date.now() - 3600000);
		// Insert a credit with expires_at in the past
		await storage.appendEntry({
			userId: 'user1',
			amount: 500,
			idempotencyKey: 'top-expiring',
			expiresAt: past,
			remaining: 500,
		});

		// biome-ignore lint/style/noNonNullAssertion: expireCredits is guaranteed by createDrizzleStorage
		const result = await storage.expireCredits!('user1', new Date());
		expect(result.expiredCount).toBe(1);
		expect(result.expiredAmount).toBe(500);

		const balance = await storage.getBalance('user1');
		expect(balance).toBe(0);
	});

	it('metadata round-trip: stores and retrieves metadata', async () => {
		const meta = '{"cost": 0.05, "model": "gpt-4"}';
		await storage.appendEntry({
			userId: 'user1',
			amount: 100,
			idempotencyKey: 'meta-1',
			metadata: meta,
		});

		const entry = await storage.findEntry('meta-1');
		expect(entry?.metadata).toBe(meta);
	});

	it('getCheckouts filters by status', async () => {
		await storage.saveCheckout({
			id: 'c-1',
			userId: 'user1',
			amount: 50000,
			redirectUrl: 'https://example.com/pay',
			status: 'pending',
			createdAt: new Date(),
		});
		await storage.saveCheckout({
			id: 'c-2',
			userId: 'user1',
			amount: 100000,
			redirectUrl: 'https://example.com/pay',
			status: 'paid',
			createdAt: new Date(),
		});

		const pending = await storage.getCheckouts?.('user1', {
			limit: 10,
			offset: 0,
			status: 'pending',
		});
		expect(pending).toHaveLength(1);
		expect(pending?.[0]?.status).toBe('pending');

		const all = await storage.getCheckouts?.('user1', { limit: 10, offset: 0 });
		expect(all).toHaveLength(2);
	});
});
