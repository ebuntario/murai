// Append-only transaction ledger with double-entry accounting
// Critical invariants:
//   - Never update or delete ledger entries
//   - SELECT FOR UPDATE on balance reads during writes (enforced by StorageAdapter)
//   - All mutations require an idempotency key

import { IdempotencyConflictError, InvalidAmountError } from './errors.js';
import type { LedgerEntry, StorageAdapter } from './types.js';

export interface Ledger {
	credit(userId: string, amount: number, idempotencyKey: string): Promise<LedgerEntry>;
	debit(userId: string, amount: number, idempotencyKey: string): Promise<LedgerEntry>;
	getBalance(userId: string): Promise<number>;
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

	return {
		credit,
		debit,
		getBalance: (userId) => storage.getBalance(userId),
	};
}
