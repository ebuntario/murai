import { describe, expect, it } from 'vitest';
import {
	GatewayError,
	IdempotencyConflictError,
	InsufficientBalanceError,
	InvalidAmountError,
	InvalidExpirationError,
	InvalidMetadataError,
} from '../errors.js';
import { createWallet } from '../wallet.js';
import { createMockStorage } from './helpers.js';

describe('createWallet', () => {
	it('getBalance returns 0 for new user', async () => {
		const wallet = createWallet({ storage: createMockStorage() });
		await expect(wallet.getBalance('user1')).resolves.toBe(0);
	});

	it('canSpend returns false when balance is less than amount', async () => {
		const wallet = createWallet({ storage: createMockStorage() });
		await expect(wallet.canSpend('user1', 100)).resolves.toBe(false);
	});

	it('canSpend returns true when balance equals amount', async () => {
		const wallet = createWallet({ storage: createMockStorage() });
		await wallet.topUp('user1', 100, 'top-1');
		await expect(wallet.canSpend('user1', 100)).resolves.toBe(true);
	});

	it('canSpend returns true when balance exceeds amount', async () => {
		const wallet = createWallet({ storage: createMockStorage() });
		await wallet.topUp('user1', 200, 'top-1');
		await expect(wallet.canSpend('user1', 100)).resolves.toBe(true);
	});

	it('spend throws InsufficientBalanceError when balance is less than amount', async () => {
		const wallet = createWallet({ storage: createMockStorage() });
		await expect(wallet.spend('user1', 100, 'spend-1')).rejects.toThrow(InsufficientBalanceError);
	});

	it('InsufficientBalanceError.message does not leak userId or balance', async () => {
		const wallet = createWallet({ storage: createMockStorage() });
		try {
			await wallet.spend('secret-user-42', 100, 'spend-leak');
			expect.unreachable('should have thrown');
		} catch (err) {
			expect(err).toBeInstanceOf(InsufficientBalanceError);
			const e = err as InsufficientBalanceError;
			expect(e.message).toBe('Insufficient balance');
			expect(e.message).not.toContain('secret-user-42');
			expect(e.userId).toBe('secret-user-42');
			expect(e.requested).toBe(100);
			expect(e.available).toBe(0);
		}
	});

	it('spend deducts balance correctly', async () => {
		const wallet = createWallet({ storage: createMockStorage() });
		await wallet.topUp('user1', 500, 'top-1');
		await wallet.spend('user1', 200, 'spend-1');
		await expect(wallet.getBalance('user1')).resolves.toBe(300);
	});

	it('topUp adds to balance correctly', async () => {
		const wallet = createWallet({ storage: createMockStorage() });
		await wallet.topUp('user1', 1000, 'top-1');
		await expect(wallet.getBalance('user1')).resolves.toBe(1000);
	});

	it('spend and topUp compose correctly', async () => {
		const wallet = createWallet({ storage: createMockStorage() });
		await wallet.topUp('user1', 1000, 'top-1');
		await wallet.spend('user1', 300, 'spend-1');
		await wallet.topUp('user1', 200, 'top-2');
		await wallet.spend('user1', 100, 'spend-2');
		await expect(wallet.getBalance('user1')).resolves.toBe(800);
	});

	it('spend throws IdempotencyConflictError on duplicate key', async () => {
		const wallet = createWallet({ storage: createMockStorage() });
		await wallet.topUp('user1', 1000, 'top-1');
		await wallet.spend('user1', 100, 'spend-1');
		await expect(wallet.spend('user1', 50, 'spend-1')).rejects.toThrow(IdempotencyConflictError);
	});

	describe('getTransactions', () => {
		it('returns all transactions for a user', async () => {
			const wallet = createWallet({ storage: createMockStorage() });
			await wallet.topUp('user1', 500, 'top-1');
			await wallet.spend('user1', 100, 'spend-1');

			const txns = await wallet.getTransactions('user1');
			expect(txns).toHaveLength(2);
		});

		it('delegates filtering to ledger', async () => {
			const wallet = createWallet({ storage: createMockStorage() });
			await wallet.topUp('user1', 500, 'top-1');
			await wallet.spend('user1', 100, 'spend-1');

			const credits = await wallet.getTransactions('user1', { type: 'credit' });
			expect(credits).toHaveLength(1);
			expect(credits[0]?.amount).toBeGreaterThan(0);
		});
	});

	describe('getCheckouts', () => {
		it('throws when storage does not implement getCheckouts', async () => {
			const storage = createMockStorage();
			const { getCheckouts: _, ...storageWithout } = storage;
			const wallet = createWallet({ storage: storageWithout as typeof storage });
			await expect(wallet.getCheckouts('user1')).rejects.toThrow(
				'Storage adapter does not implement getCheckouts',
			);
		});

		it('returns checkouts for a user', async () => {
			const storage = createMockStorage();
			await storage.saveCheckout({
				id: 'c-1',
				userId: 'user1',
				amount: 100000,
				redirectUrl: 'https://example.com/pay',
				status: 'pending',
				createdAt: new Date(),
			});
			await storage.saveCheckout({
				id: 'c-2',
				userId: 'user1',
				amount: 200000,
				redirectUrl: 'https://example.com/pay',
				status: 'paid',
				createdAt: new Date(),
			});

			const wallet = createWallet({ storage });
			const result = await wallet.getCheckouts('user1');
			expect(result).toHaveLength(2);
		});

		it('filters by status', async () => {
			const storage = createMockStorage();
			await storage.saveCheckout({
				id: 'c-1',
				userId: 'user1',
				amount: 100000,
				redirectUrl: 'https://example.com/pay',
				status: 'pending',
				createdAt: new Date(),
			});
			await storage.saveCheckout({
				id: 'c-2',
				userId: 'user1',
				amount: 200000,
				redirectUrl: 'https://example.com/pay',
				status: 'paid',
				createdAt: new Date(),
			});

			const wallet = createWallet({ storage });
			const paid = await wallet.getCheckouts('user1', { status: 'paid' });
			expect(paid).toHaveLength(1);
			expect(paid[0]?.status).toBe('paid');
		});

		it('throws for invalid limit', async () => {
			const wallet = createWallet({ storage: createMockStorage() });
			await expect(wallet.getCheckouts('user1', { limit: 0 })).rejects.toThrow(InvalidAmountError);
		});

		it('throws for negative offset', async () => {
			const wallet = createWallet({ storage: createMockStorage() });
			await expect(wallet.getCheckouts('user1', { offset: -1 })).rejects.toThrow(
				InvalidAmountError,
			);
		});
	});

	describe('token expiration', () => {
		it('topUp with expiresAt stores the field', async () => {
			const storage = createMockStorage();
			const wallet = createWallet({ storage });
			const future = new Date(Date.now() + 86400000); // +1 day
			await wallet.topUp('user1', 1000, 'top-1', { expiresAt: future });

			const entry = await storage.findEntry('top-1');
			expect(entry?.expiresAt?.getTime()).toBe(future.getTime());
			expect(entry?.remaining).toBe(1000);
		});

		it('topUp rejects past expiresAt with InvalidExpirationError', async () => {
			const wallet = createWallet({ storage: createMockStorage() });
			const past = new Date(Date.now() - 86400000); // -1 day
			await expect(wallet.topUp('user1', 1000, 'top-1', { expiresAt: past })).rejects.toThrow(
				InvalidExpirationError,
			);
		});

		it('FIFO spend: earliest-expiring bucket consumed first', async () => {
			const storage = createMockStorage();
			const wallet = createWallet({ storage });

			const soon = new Date(Date.now() + 3600000); // +1hr
			const later = new Date(Date.now() + 86400000); // +1day

			await wallet.topUp('user1', 500, 'top-later', { expiresAt: later });
			await wallet.topUp('user1', 300, 'top-soon', { expiresAt: soon });

			await wallet.spend('user1', 200, 'spend-1');

			// The "soon" bucket should have been consumed first
			const soonEntry = await storage.findEntry('top-soon');
			const laterEntry = await storage.findEntry('top-later');
			expect(soonEntry?.remaining).toBe(100); // 300 - 200
			expect(laterEntry?.remaining).toBe(500); // untouched
		});

		it('spend skips expired-but-not-yet-processed buckets', async () => {
			const storage = createMockStorage();
			const wallet = createWallet({ storage });

			const future = new Date(Date.now() + 86400000); // +1day
			const past = new Date(Date.now() - 3600000); // -1hr

			// TopUp both with future dates, then backdate one
			await wallet.topUp('user1', 500, 'top-expired', { expiresAt: new Date(Date.now() + 10000) });
			await wallet.topUp('user1', 300, 'top-valid', { expiresAt: future });

			// Manually backdate the first entry's expiresAt to simulate expiration
			const expiredEntry = await storage.findEntry('top-expired');
			if (expiredEntry) {
				(expiredEntry as { expiresAt: Date }).expiresAt = past;
			}

			// Balance is 800 (materialized), but spendable is only 300 (valid bucket)
			await expect(wallet.spend('user1', 400, 'spend-1')).rejects.toThrow(InsufficientBalanceError);

			// Can spend from valid bucket
			await wallet.spend('user1', 200, 'spend-2');
			const validEntry = await storage.findEntry('top-valid');
			expect(validEntry?.remaining).toBe(100);
		});

		it('non-expiring buckets consumed last (NULLS LAST)', async () => {
			const storage = createMockStorage();
			const wallet = createWallet({ storage });

			const future = new Date(Date.now() + 86400000);

			await wallet.topUp('user1', 500, 'top-no-expiry'); // no expiresAt
			await wallet.topUp('user1', 300, 'top-expiring', { expiresAt: future });

			await wallet.spend('user1', 200, 'spend-1');

			// Expiring bucket should be consumed first
			const expiringEntry = await storage.findEntry('top-expiring');
			const noExpiryEntry = await storage.findEntry('top-no-expiry');
			expect(expiringEntry?.remaining).toBe(100); // 300 - 200
			expect(noExpiryEntry?.remaining).toBe(500); // untouched
		});

		it('spend across multiple buckets', async () => {
			const storage = createMockStorage();
			const wallet = createWallet({ storage });

			const soon = new Date(Date.now() + 3600000);
			const later = new Date(Date.now() + 86400000);

			await wallet.topUp('user1', 200, 'top-1', { expiresAt: soon });
			await wallet.topUp('user1', 300, 'top-2', { expiresAt: later });

			await wallet.spend('user1', 350, 'spend-1');

			const entry1 = await storage.findEntry('top-1');
			const entry2 = await storage.findEntry('top-2');
			expect(entry1?.remaining).toBe(0); // fully consumed
			expect(entry2?.remaining).toBe(150); // 300 - 150
		});

		it('expireTokens creates debit entries and sets remaining=0', async () => {
			const storage = createMockStorage();
			const wallet = createWallet({ storage });

			const past = new Date(Date.now() - 3600000);
			// topUp with a future date, then backdate it
			await wallet.topUp('user1', 1000, 'top-1', { expiresAt: new Date(Date.now() + 10000) });

			// Backdate the entry
			const entry = await storage.findEntry('top-1');
			if (entry) {
				(entry as { expiresAt: Date }).expiresAt = past;
			}

			const result = await wallet.expireTokens('user1');
			expect(result.expiredCount).toBe(1);
			expect(result.expiredAmount).toBe(1000);
			await expect(wallet.getBalance('user1')).resolves.toBe(0);
		});

		it('expireTokens is idempotent', async () => {
			const storage = createMockStorage();
			const wallet = createWallet({ storage });

			const past = new Date(Date.now() - 3600000);
			await wallet.topUp('user1', 1000, 'top-1', { expiresAt: new Date(Date.now() + 10000) });

			const entry = await storage.findEntry('top-1');
			if (entry) {
				(entry as { expiresAt: Date }).expiresAt = past;
			}

			await wallet.expireTokens('user1');
			const result = await wallet.expireTokens('user1');
			expect(result.expiredCount).toBe(0);
			expect(result.expiredAmount).toBe(0);
		});

		it('credits without expiresAt never expired', async () => {
			const storage = createMockStorage();
			const wallet = createWallet({ storage });

			await wallet.topUp('user1', 1000, 'top-1'); // no expiresAt

			const result = await wallet.expireTokens('user1');
			expect(result.expiredCount).toBe(0);
			expect(result.expiredAmount).toBe(0);
			await expect(wallet.getBalance('user1')).resolves.toBe(1000);
		});

		it('partial expiration: topUp 1000 with expiry, spend 300, expire debits only 700', async () => {
			const storage = createMockStorage();
			const wallet = createWallet({ storage });

			const past = new Date(Date.now() - 3600000);
			await wallet.topUp('user1', 1000, 'top-1', { expiresAt: new Date(Date.now() + 10000) });

			// Spend 300 first
			await wallet.spend('user1', 300, 'spend-1');

			// Then backdate and expire
			const entry = await storage.findEntry('top-1');
			if (entry) {
				(entry as { expiresAt: Date }).expiresAt = past;
			}

			const result = await wallet.expireTokens('user1');
			expect(result.expiredAmount).toBe(700);
			await expect(wallet.getBalance('user1')).resolves.toBe(0);
		});

		it('expireTokens throws when storage does not implement expireCredits', async () => {
			const storage = createMockStorage();
			const { expireCredits: _, ...storageWithout } = storage;
			const wallet = createWallet({ storage: storageWithout as typeof storage });
			await expect(wallet.expireTokens('user1')).rejects.toThrow(
				'Storage adapter does not implement expireCredits',
			);
		});
	});

	describe('metadata & usage report', () => {
		it('spend with metadata stores it', async () => {
			const storage = createMockStorage();
			const wallet = createWallet({ storage });
			await wallet.topUp('user1', 1000, 'top-1');
			await wallet.spend('user1', 100, 'spend-1', { metadata: '{"cost": 0.05}' });

			const entry = await storage.findEntry('spend-1');
			expect(entry?.metadata).toBe('{"cost": 0.05}');
		});

		it('spend rejects invalid JSON metadata with InvalidMetadataError', async () => {
			const wallet = createWallet({ storage: createMockStorage() });
			await wallet.topUp('user1', 1000, 'top-1');
			await expect(wallet.spend('user1', 100, 'spend-1', { metadata: 'not-json' })).rejects.toThrow(
				InvalidMetadataError,
			);
		});

		it('spend rejects metadata > 4KB', async () => {
			const wallet = createWallet({ storage: createMockStorage() });
			await wallet.topUp('user1', 1000, 'top-1');
			const bigMeta = JSON.stringify({ data: 'x'.repeat(5000) });
			await expect(wallet.spend('user1', 100, 'spend-1', { metadata: bigMeta })).rejects.toThrow(
				InvalidMetadataError,
			);
		});

		it('spend rejects metadata where cost is negative', async () => {
			const wallet = createWallet({ storage: createMockStorage() });
			await wallet.topUp('user1', 1000, 'top-1');
			await expect(
				wallet.spend('user1', 100, 'spend-1', { metadata: '{"cost": -1}' }),
			).rejects.toThrow(InvalidMetadataError);
		});

		it('spend rejects metadata where cost is NaN', async () => {
			const wallet = createWallet({ storage: createMockStorage() });
			await wallet.topUp('user1', 1000, 'top-1');
			await expect(
				wallet.spend('user1', 100, 'spend-1', { metadata: '{"cost": "not-a-number"}' }),
			).rejects.toThrow(InvalidMetadataError);
		});

		it('getUsageReport sums credits and debits correctly', async () => {
			const wallet = createWallet({ storage: createMockStorage() });
			await wallet.topUp('user1', 1000, 'top-1');
			await wallet.topUp('user1', 500, 'top-2');
			await wallet.spend('user1', 200, 'spend-1');
			await wallet.spend('user1', 100, 'spend-2');

			const report = await wallet.getUsageReport('user1', {
				from: new Date(Date.now() - 86400000),
				to: new Date(Date.now() + 86400000),
			});

			expect(report.totalCredits).toBe(1500);
			expect(report.totalDebits).toBe(300);
			expect(report.transactionCount).toBe(4);
		});

		it('getUsageReport parses cost from debit metadata', async () => {
			const wallet = createWallet({ storage: createMockStorage() });
			await wallet.topUp('user1', 1000, 'top-1');
			await wallet.spend('user1', 200, 'spend-1', { metadata: '{"cost": 0.05}' });
			await wallet.spend('user1', 100, 'spend-2', { metadata: '{"cost": 0.03}' });

			const report = await wallet.getUsageReport('user1', {
				from: new Date(Date.now() - 86400000),
				to: new Date(Date.now() + 86400000),
			});

			expect(report.totalProviderCost).toBeCloseTo(0.08);
		});

		it('getUsageReport handles debits without metadata (cost = 0)', async () => {
			const wallet = createWallet({ storage: createMockStorage() });
			await wallet.topUp('user1', 1000, 'top-1');
			await wallet.spend('user1', 200, 'spend-1');

			const report = await wallet.getUsageReport('user1', {
				from: new Date(Date.now() - 86400000),
				to: new Date(Date.now() + 86400000),
			});

			expect(report.totalProviderCost).toBe(0);
		});

		it('getUsageReport paginates beyond 100 transactions', async () => {
			const storage = createMockStorage();
			const wallet = createWallet({ storage });

			// Create 120 credits of 10 each
			await wallet.topUp('user1', 100000, 'top-seed');
			for (let i = 0; i < 120; i++) {
				await wallet.spend('user1', 1, `spend-${i}`, { metadata: '{"cost": 0.01}' });
			}

			const report = await wallet.getUsageReport('user1', {
				from: new Date(Date.now() - 86400000),
				to: new Date(Date.now() + 86400000),
			});

			// 1 credit + 120 debits = 121 transactions
			expect(report.transactionCount).toBe(121);
			expect(report.totalDebits).toBe(120);
			expect(report.totalProviderCost).toBeCloseTo(1.2);
		});

		it('getUsageReport with empty date range returns zeros', async () => {
			const wallet = createWallet({ storage: createMockStorage() });
			await wallet.topUp('user1', 1000, 'top-1');

			const report = await wallet.getUsageReport('user1', {
				from: new Date(Date.now() - 172800000),
				to: new Date(Date.now() - 86400000),
			});

			expect(report.totalCredits).toBe(0);
			expect(report.totalDebits).toBe(0);
			expect(report.totalProviderCost).toBe(0);
			expect(report.transactionCount).toBe(0);
		});
	});

	describe('error message sanitization', () => {
		it('GatewayError.message does not leak raw gateway response', () => {
			const err = new GatewayError('stripe', 500, 'sk_live_secret_key_leaked in response body');
			expect(err.message).toBe('Payment gateway error (stripe)');
			expect(err.message).not.toContain('sk_live');
			expect(err.gatewayMessage).toBe('sk_live_secret_key_leaked in response body');
			expect(err.gatewayName).toBe('stripe');
			expect(err.httpStatus).toBe(500);
		});
	});
});
