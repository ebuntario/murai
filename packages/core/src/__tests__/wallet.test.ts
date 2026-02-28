import { describe, expect, it } from 'vitest';
import { IdempotencyConflictError, InsufficientBalanceError } from '../errors.js';
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
});
