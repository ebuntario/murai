// Append-only transaction ledger with double-entry accounting
// Critical invariants:
//   - Never update or delete ledger entries
//   - SELECT FOR UPDATE on balance reads during writes (enforced by StorageAdapter)
//   - All mutations require an idempotency key

import { IdempotencyConflictError, InvalidAmountError } from './errors.js';
import type { LedgerEntry, StorageAdapter, TransactionQuery } from './types.js';

export interface Ledger {
	credit(userId: string, amount: number, idempotencyKey: string): Promise<LedgerEntry>;
	debit(userId: string, amount: number, idempotencyKey: string): Promise<LedgerEntry>;
	getBalance(userId: string): Promise<number>;
	getTransactions(userId: string, query?: TransactionQuery): Promise<LedgerEntry[]>;
}

export function createLedger(storage: StorageAdapter): Ledger {
	async function credit(
		userId: string,
		amount: number,
		idempotencyKey: string,
	): Promise<LedgerEntry> {
		if (!Number.isInteger(amount) || amount <= 0) {
			throw new InvalidAmountError(amount);
		}
		const existing = await storage.findEntry(idempotencyKey);
		if (existing) {
			throw new IdempotencyConflictError(idempotencyKey);
		}
		return storage.appendEntry({ userId, amount, idempotencyKey });
	}

	async function debit(
		userId: string,
		amount: number,
		idempotencyKey: string,
	): Promise<LedgerEntry> {
		if (!Number.isInteger(amount) || amount <= 0) {
			throw new InvalidAmountError(amount);
		}
		const existing = await storage.findEntry(idempotencyKey);
		if (existing) {
			throw new IdempotencyConflictError(idempotencyKey);
		}
		return storage.appendEntry({ userId, amount: -amount, idempotencyKey });
	}

	async function getTransactions(userId: string, query?: TransactionQuery): Promise<LedgerEntry[]> {
		if (!storage.getTransactions) {
			throw new Error('Storage adapter does not implement getTransactions');
		}
		const limit = query?.limit ?? 50;
		const offset = query?.offset ?? 0;
		if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
			throw new InvalidAmountError(limit);
		}
		if (!Number.isInteger(offset) || offset < 0) {
			throw new InvalidAmountError(offset);
		}
		return storage.getTransactions(userId, { ...query, limit, offset });
	}

	return {
		credit,
		debit,
		getBalance: (userId) => storage.getBalance(userId),
		getTransactions,
	};
}
