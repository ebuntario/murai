import { describe, expect, it } from 'vitest';
import {
	IdempotencyConflictError,
	InsufficientBalanceError,
	InvalidAmountError,
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
});
