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
});
