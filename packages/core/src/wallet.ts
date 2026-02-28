// Public API: getBalance, canSpend, spend, topUp, getTransactions, getCheckouts

import { InsufficientBalanceError, InvalidAmountError } from './errors.js';
import { createLedger } from './ledger.js';
import type {
	CheckoutQuery,
	CheckoutSession,
	LedgerEntry,
	StorageAdapter,
	TransactionQuery,
	Wallet,
	WalletConfig,
} from './types.js';

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

	async function spend(userId: string, amount: number, idempotencyKey: string): Promise<void> {
		const balance = await ledger.getBalance(userId);
		if (balance < amount) {
			throw new InsufficientBalanceError(userId, amount, balance);
		}
		await ledger.debit(userId, amount, idempotencyKey);
	}

	async function topUp(userId: string, amount: number, idempotencyKey: string): Promise<void> {
		await ledger.credit(userId, amount, idempotencyKey);
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

	return { getBalance, canSpend, spend, topUp, getTransactions, getCheckouts };
}
