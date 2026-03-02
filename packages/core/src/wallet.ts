// Public API: getBalance, canSpend, spend, topUp, expireTokens, getUsageReport, getTransactions, getCheckouts

import {
	InsufficientBalanceError,
	InvalidAmountError,
	InvalidExpirationError,
	InvalidMetadataError,
} from './errors.js';
import { createLedger } from './ledger.js';
import type {
	CheckoutQuery,
	CheckoutSession,
	ExpireResult,
	LedgerEntry,
	StorageAdapter,
	TransactionQuery,
	UsageReport,
	Wallet,
	WalletConfig,
} from './types.js';

const MAX_METADATA_BYTES = 4096;

interface MetadataShape {
	cost: unknown;
}

function validateMetadata(metadata: string): void {
	if (Buffer.byteLength(metadata, 'utf8') > MAX_METADATA_BYTES) {
		throw new InvalidMetadataError('metadata exceeds 4KB limit');
	}
	let parsed: unknown;
	try {
		parsed = JSON.parse(metadata);
	} catch {
		throw new InvalidMetadataError('metadata is not valid JSON');
	}
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw new InvalidMetadataError('metadata must be a JSON object');
	}
	const obj = parsed as MetadataShape;
	if ('cost' in obj) {
		const cost = obj.cost;
		if (typeof cost !== 'number' || !Number.isFinite(cost) || cost < 0) {
			throw new InvalidMetadataError('cost must be a non-negative finite number');
		}
	}
}

export function createWallet(config: WalletConfig): Wallet {
	const storage: StorageAdapter = config.storage;
	const ledger = createLedger(storage);

	async function getBalance(userId: string): Promise<number> {
		return ledger.getBalance(userId);
	}

	async function canSpend(userId: string, amount: number): Promise<boolean> {
		const balance = await ledger.getBalance(userId);
		return balance >= amount;
	}

	async function spend(
		userId: string,
		amount: number,
		idempotencyKey: string,
		options?: { metadata?: string },
	): Promise<void> {
		if (options?.metadata !== undefined) {
			validateMetadata(options.metadata);
		}
		// Advisory pre-check: avoids a storage-layer round-trip for obvious failures.
		// NOT a safety mechanism — the storage adapter re-checks under lock (SELECT FOR UPDATE).
		const balance = await ledger.getBalance(userId);
		if (balance < amount) {
			throw new InsufficientBalanceError(userId, amount, balance);
		}
		const metadata = options?.metadata;
		await ledger.debit(
			userId,
			amount,
			idempotencyKey,
			metadata !== undefined ? { metadata } : undefined,
		);
	}

	async function topUp(
		userId: string,
		amount: number,
		idempotencyKey: string,
		options?: { expiresAt?: Date; metadata?: string },
	): Promise<void> {
		if (options?.expiresAt !== undefined) {
			if (options.expiresAt <= new Date()) {
				throw new InvalidExpirationError(options.expiresAt);
			}
		}
		if (options?.metadata !== undefined) {
			validateMetadata(options.metadata);
		}
		const creditOptions: { expiresAt?: Date; metadata?: string } = {};
		if (options?.expiresAt !== undefined) {
			creditOptions.expiresAt = options.expiresAt;
		}
		if (options?.metadata !== undefined) {
			creditOptions.metadata = options.metadata;
		}
		await ledger.credit(
			userId,
			amount,
			idempotencyKey,
			Object.keys(creditOptions).length > 0 ? creditOptions : undefined,
		);
	}

	async function expireTokens(userId: string): Promise<ExpireResult> {
		if (!storage.expireCredits) {
			throw new Error('Storage adapter does not implement expireCredits');
		}
		return storage.expireCredits(userId, new Date());
	}

	async function getUsageReport(
		userId: string,
		dateRange: { from: Date; to: Date },
	): Promise<UsageReport> {
		const pageSize = 100;
		let totalCredits = 0;
		let totalDebits = 0;
		let totalProviderCost = 0;
		let transactionCount = 0;
		let offset = 0;

		for (;;) {
			const txns = await ledger.getTransactions(userId, {
				from: dateRange.from,
				to: dateRange.to,
				limit: pageSize,
				offset,
			});

			transactionCount += txns.length;

			for (const txn of txns) {
				if (txn.amount > 0) {
					totalCredits += txn.amount;
				} else {
					totalDebits += Math.abs(txn.amount);
					if (txn.metadata) {
						try {
							const meta = JSON.parse(txn.metadata) as MetadataShape;
							const cost = meta.cost;
							if (typeof cost === 'number' && Number.isFinite(cost)) {
								totalProviderCost += cost;
							}
						} catch {
							// ignore invalid metadata in aggregation
						}
					}
				}
			}

			if (txns.length < pageSize) break;
			offset += pageSize;
		}

		return { totalCredits, totalDebits, totalProviderCost, transactionCount };
	}

	async function getTransactions(userId: string, query?: TransactionQuery): Promise<LedgerEntry[]> {
		return ledger.getTransactions(userId, query);
	}

	async function getCheckouts(userId: string, query?: CheckoutQuery): Promise<CheckoutSession[]> {
		if (!storage.getCheckouts) {
			throw new Error('Storage adapter does not implement getCheckouts');
		}
		const limit = query?.limit ?? 50;
		const offset = query?.offset ?? 0;
		if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
			throw new InvalidAmountError(limit);
		}
		if (!Number.isInteger(offset) || offset < 0) {
			throw new InvalidAmountError(offset);
		}
		return storage.getCheckouts(userId, { ...query, limit, offset });
	}

	return {
		getBalance,
		canSpend,
		spend,
		topUp,
		expireTokens,
		getUsageReport,
		getTransactions,
		getCheckouts,
	};
}
