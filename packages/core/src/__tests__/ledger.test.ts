import { describe, expect, it } from 'vitest';
import { IdempotencyConflictError, InvalidAmountError } from '../errors.js';
import { createLedger } from '../ledger.js';
import { createMockStorage } from './helpers.js';

describe('createLedger', () => {
	describe('credit', () => {
		it('throws InvalidAmountError for zero amount', async () => {
			const ledger = createLedger(createMockStorage());
			await expect(ledger.credit('user1', 0, 'key-1')).rejects.toThrow(InvalidAmountError);
		});

		it('throws InvalidAmountError for negative amount', async () => {
			const ledger = createLedger(createMockStorage());
			await expect(ledger.credit('user1', -100, 'key-1')).rejects.toThrow(InvalidAmountError);
		});

		it('throws InvalidAmountError for non-integer amount', async () => {
			const ledger = createLedger(createMockStorage());
			await expect(ledger.credit('user1', 1.5, 'key-1')).rejects.toThrow(InvalidAmountError);
		});

		it('throws IdempotencyConflictError on duplicate key', async () => {
			const ledger = createLedger(createMockStorage());
			await ledger.credit('user1', 100, 'key-1');
			await expect(ledger.credit('user1', 100, 'key-1')).rejects.toThrow(IdempotencyConflictError);
		});
	});

	describe('debit', () => {
		it('throws InvalidAmountError for zero amount', async () => {
			const ledger = createLedger(createMockStorage());
			await ledger.credit('user1', 100, 'top-1');
			await expect(ledger.debit('user1', 0, 'key-1')).rejects.toThrow(InvalidAmountError);
		});

		it('throws InvalidAmountError for negative amount', async () => {
			const ledger = createLedger(createMockStorage());
			await ledger.credit('user1', 100, 'top-1');
			await expect(ledger.debit('user1', -50, 'key-1')).rejects.toThrow(InvalidAmountError);
		});

		it('throws InvalidAmountError for non-integer amount', async () => {
			const ledger = createLedger(createMockStorage());
			await ledger.credit('user1', 100, 'top-1');
			await expect(ledger.debit('user1', 0.5, 'key-1')).rejects.toThrow(InvalidAmountError);
		});

		it('throws IdempotencyConflictError on duplicate key', async () => {
			const ledger = createLedger(createMockStorage());
			await ledger.credit('user1', 500, 'top-1');
			await ledger.debit('user1', 100, 'debit-1');
			await expect(ledger.debit('user1', 50, 'debit-1')).rejects.toThrow(IdempotencyConflictError);
		});
	});

	it('appended entries are immutable — mock records are never mutated', async () => {
		const storage = createMockStorage();
		const ledger = createLedger(storage);

		const entry = await ledger.credit('user1', 100, 'key-1');
		const originalId = entry.id;
		const originalAmount = entry.amount;
		const originalCreatedAt = entry.createdAt;

		// Verify the returned entry has stable values by reading it back
		const found = await storage.findEntry('key-1');
		expect(found?.id).toBe(originalId);
		expect(found?.amount).toBe(originalAmount);
		expect(found?.createdAt).toBe(originalCreatedAt);

		// Attempting to credit again with a different key should not change the first entry
		await ledger.credit('user1', 50, 'key-2');
		const foundAgain = await storage.findEntry('key-1');
		expect(foundAgain?.amount).toBe(originalAmount);
	});

	describe('getTransactions', () => {
		it('throws when storage does not implement getTransactions', async () => {
			const storage = createMockStorage();
			// Create a storage without getTransactions
			const { getTransactions: _, ...storageWithout } = storage;
			const ledger = createLedger(storageWithout as typeof storage);
			await expect(ledger.getTransactions('user1')).rejects.toThrow(
				'Storage adapter does not implement getTransactions',
			);
		});

		it('returns transactions for a user', async () => {
			const storage = createMockStorage();
			const ledger = createLedger(storage);
			await ledger.credit('user1', 100, 'c-1');
			await ledger.credit('user1', 200, 'c-2');

			const txns = await ledger.getTransactions('user1');
			expect(txns).toHaveLength(2);
		});

		it('respects limit parameter', async () => {
			const storage = createMockStorage();
			const ledger = createLedger(storage);
			await ledger.credit('user1', 100, 'c-1');
			await ledger.credit('user1', 200, 'c-2');
			await ledger.credit('user1', 300, 'c-3');

			const txns = await ledger.getTransactions('user1', { limit: 2 });
			expect(txns).toHaveLength(2);
		});

		it('respects offset parameter', async () => {
			const storage = createMockStorage();
			const ledger = createLedger(storage);
			await ledger.credit('user1', 100, 'c-1');
			await ledger.credit('user1', 200, 'c-2');
			await ledger.credit('user1', 300, 'c-3');

			const txns = await ledger.getTransactions('user1', { offset: 2 });
			expect(txns).toHaveLength(1);
		});

		it('filters by credit type', async () => {
			const storage = createMockStorage();
			const ledger = createLedger(storage);
			await ledger.credit('user1', 500, 'c-1');
			await ledger.debit('user1', 100, 'd-1');
			await ledger.credit('user1', 200, 'c-2');

			const credits = await ledger.getTransactions('user1', { type: 'credit' });
			expect(credits).toHaveLength(2);
			for (const t of credits) {
				expect(t.amount).toBeGreaterThan(0);
			}
		});

		it('filters by debit type', async () => {
			const storage = createMockStorage();
			const ledger = createLedger(storage);
			await ledger.credit('user1', 500, 'c-1');
			await ledger.debit('user1', 100, 'd-1');
			await ledger.debit('user1', 50, 'd-2');

			const debits = await ledger.getTransactions('user1', { type: 'debit' });
			expect(debits).toHaveLength(2);
			for (const t of debits) {
				expect(t.amount).toBeLessThan(0);
			}
		});

		it('returns empty array for user with no transactions', async () => {
			const ledger = createLedger(createMockStorage());
			const txns = await ledger.getTransactions('ghost');
			expect(txns).toEqual([]);
		});

		it('throws for invalid limit (0)', async () => {
			const ledger = createLedger(createMockStorage());
			await expect(ledger.getTransactions('user1', { limit: 0 })).rejects.toThrow(
				InvalidAmountError,
			);
		});

		it('throws for invalid limit (> 100)', async () => {
			const ledger = createLedger(createMockStorage());
			await expect(ledger.getTransactions('user1', { limit: 101 })).rejects.toThrow(
				InvalidAmountError,
			);
		});

		it('throws for negative offset', async () => {
			const ledger = createLedger(createMockStorage());
			await expect(ledger.getTransactions('user1', { offset: -1 })).rejects.toThrow(
				InvalidAmountError,
			);
		});
	});
});
