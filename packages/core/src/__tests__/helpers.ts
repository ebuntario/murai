// Shared in-memory StorageAdapter mock for unit tests

import { randomUUID } from 'node:crypto';
import { IdempotencyConflictError, InsufficientBalanceError } from '../errors.js';
import type { CheckoutSession, LedgerEntry, StorageAdapter } from '../types.js';

export function createMockStorage(): StorageAdapter {
	const balances = new Map<string, number>();
	const entries = new Map<string, LedgerEntry>(); // keyed by idempotencyKey
	const checkouts = new Map<string, CheckoutSession>(); // keyed by id

	return {
		async getBalance(userId) {
			return balances.get(userId) ?? 0;
		},

		async appendEntry(entry) {
			if (entries.has(entry.idempotencyKey)) {
				throw new IdempotencyConflictError(entry.idempotencyKey);
			}
			const currentBalance = balances.get(entry.userId) ?? 0;
			if (entry.amount < 0 && currentBalance < Math.abs(entry.amount)) {
				throw new InsufficientBalanceError(entry.userId, Math.abs(entry.amount), currentBalance);
			}
			const ledgerEntry: LedgerEntry = {
				id: randomUUID(),
				userId: entry.userId,
				amount: entry.amount,
				idempotencyKey: entry.idempotencyKey,
				createdAt: new Date(),
			};
			entries.set(entry.idempotencyKey, ledgerEntry);
			balances.set(entry.userId, currentBalance + entry.amount);
			return ledgerEntry;
		},

		async findEntry(idempotencyKey) {
			return entries.get(idempotencyKey) ?? null;
		},

		async saveCheckout(session) {
			checkouts.set(session.id, session);
			return session;
		},

		async findCheckout(id) {
			return checkouts.get(id) ?? null;
		},

		async updateCheckoutStatus(id, status) {
			const session = checkouts.get(id);
			if (session) {
				checkouts.set(id, { ...session, status });
			}
		},
	};
}
