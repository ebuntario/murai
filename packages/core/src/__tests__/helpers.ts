// Shared in-memory StorageAdapter mock for unit tests

import { randomUUID } from 'node:crypto';
import { IdempotencyConflictError, InsufficientBalanceError } from '../errors.js';
import type {
	CheckoutQuery,
	CheckoutSession,
	ExpireResult,
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

			// For debits: FIFO bucket consumption
			if (entry.amount < 0) {
				const debitAmount = Math.abs(entry.amount);

				// Calculate spendable balance (excluding expired-but-not-processed buckets)
				const userEntries = entriesByUser.get(entry.userId) ?? [];
				const now = new Date();
				let spendableBalance = 0;
				for (const e of userEntries) {
					if (e.amount > 0 && e.remaining != null && e.remaining > 0) {
						// Skip expired buckets
						if (e.expiresAt != null && e.expiresAt <= now) continue;
						spendableBalance += e.remaining;
					} else if (e.remaining == null) {
						// Legacy entry — already counted in currentBalance
					}
				}

				// Use spendable balance if FIFO entries exist, otherwise fall back to materialized
				const hasFifoBuckets = userEntries.some((e) => e.amount > 0 && e.remaining != null);
				const effectiveBalance = hasFifoBuckets ? spendableBalance : currentBalance;

				if (effectiveBalance < debitAmount) {
					throw new InsufficientBalanceError(entry.userId, debitAmount, effectiveBalance);
				}

				// Consume FIFO: earliest-expiring first, NULLS LAST
				if (hasFifoBuckets) {
					const activeBuckets = userEntries
						.filter((e) => {
							if (e.amount <= 0 || e.remaining == null || e.remaining <= 0) return false;
							if (e.expiresAt != null && e.expiresAt <= now) return false;
							return true;
						})
						.sort((a, b) => {
							// NULLS LAST for expiresAt
							if (a.expiresAt == null && b.expiresAt == null) {
								return a.createdAt.getTime() - b.createdAt.getTime();
							}
							if (a.expiresAt == null) return 1;
							if (b.expiresAt == null) return -1;
							const expDiff = a.expiresAt.getTime() - b.expiresAt.getTime();
							if (expDiff !== 0) return expDiff;
							return a.createdAt.getTime() - b.createdAt.getTime();
						});

					let remaining = debitAmount;
					for (const bucket of activeBuckets) {
						if (remaining <= 0) break;
						const consume = Math.min(bucket.remaining as number, remaining);
						(bucket as { remaining: number }).remaining -= consume;
						remaining -= consume;
					}
				}
			}

			const ledgerEntry: LedgerEntry = {
				id: randomUUID(),
				userId: entry.userId,
				amount: entry.amount,
				idempotencyKey: entry.idempotencyKey,
				createdAt: new Date(),
				expiresAt: entry.expiresAt ?? null,
				remaining: entry.amount > 0 ? (entry.remaining ?? null) : null,
				expiredAt: entry.expiredAt ?? null,
				metadata: entry.metadata ?? null,
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
			// Filter by date range
			if (query?.from) {
				userEntries = userEntries.filter((e) => e.createdAt >= (query.from as Date));
			}
			if (query?.to) {
				userEntries = userEntries.filter((e) => e.createdAt <= (query.to as Date));
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

		async expireCredits(userId: string, now: Date): Promise<ExpireResult> {
			const userEntries = entriesByUser.get(userId) ?? [];
			let expiredCount = 0;
			let expiredAmount = 0;

			for (const entry of userEntries) {
				if (
					entry.amount > 0 &&
					entry.remaining != null &&
					entry.remaining > 0 &&
					entry.expiresAt != null &&
					entry.expiresAt < now
				) {
					const amount = entry.remaining;
					expiredAmount += amount;
					expiredCount++;

					// Create debit entry for expiration
					const debitKey = `expire:${entry.idempotencyKey}`;
					const debitEntry: LedgerEntry = {
						id: randomUUID(),
						userId,
						amount: -amount,
						idempotencyKey: debitKey,
						createdAt: new Date(),
						metadata: null,
					};
					entries.set(debitKey, debitEntry);
					userEntries.push(debitEntry);

					// Zero out the bucket and mark as expired
					(entry as { remaining: number }).remaining = 0;
					(entry as { expiredAt: Date }).expiredAt = now;

					// Update balance
					const currentBalance = balances.get(userId) ?? 0;
					balances.set(userId, currentBalance - amount);
				}
			}

			return { expiredCount, expiredAmount };
		},

		async getUsersWithExpirableCredits(now: Date): Promise<string[]> {
			const users = new Set<string>();
			for (const [userId, userEntries] of entriesByUser) {
				for (const entry of userEntries) {
					if (
						entry.amount > 0 &&
						entry.remaining != null &&
						entry.remaining > 0 &&
						entry.expiresAt != null &&
						entry.expiresAt < now
					) {
						users.add(userId);
						break;
					}
				}
			}
			return [...users];
		},
	};
}
