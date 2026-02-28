// Shared in-memory StorageAdapter mock for unit tests

import { randomUUID } from 'node:crypto';
import { IdempotencyConflictError, InsufficientBalanceError } from '../errors.js';
import type {
	CheckoutQuery,
	CheckoutSession,
	LedgerEntry,
	StorageAdapter,
	TransactionQuery,
} from '../types.js';

export function createMockStorage(): StorageAdapter {
	const balances = new Map<string, number>();
	const entries = new Map<string, LedgerEntry>(); // keyed by idempotencyKey
	const entriesByUser = new Map<string, LedgerEntry[]>(); // ordered list per user
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
			const userEntries = entriesByUser.get(entry.userId) ?? [];
			userEntries.push(ledgerEntry);
			entriesByUser.set(entry.userId, userEntries);
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

		async getTransactions(userId: string, query?: TransactionQuery) {
			const limit = query?.limit ?? 50;
			const offset = query?.offset ?? 0;
			let userEntries = [...(entriesByUser.get(userId) ?? [])];
			// Filter by type
			if (query?.type === 'credit') {
				userEntries = userEntries.filter((e) => e.amount > 0);
			} else if (query?.type === 'debit') {
				userEntries = userEntries.filter((e) => e.amount < 0);
			}
			// Sort newest first
			userEntries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			return userEntries.slice(offset, offset + limit);
		},

		async getCheckouts(userId: string, query?: CheckoutQuery) {
			const limit = query?.limit ?? 50;
			const offset = query?.offset ?? 0;
			let userCheckouts = [...checkouts.values()].filter((c) => c.userId === userId);
			if (query?.status) {
				userCheckouts = userCheckouts.filter((c) => c.status === query.status);
			}
			// Sort newest first
			userCheckouts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			return userCheckouts.slice(offset, offset + limit);
		},
	};
}
