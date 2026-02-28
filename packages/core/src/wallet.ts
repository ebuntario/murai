// Public API: getBalance, canSpend, spend, topUp

import { InsufficientBalanceError } from './errors.js';
import { createLedger } from './ledger.js';
import type { StorageAdapter, Wallet, WalletConfig } from './types.js';

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

	return { getBalance, canSpend, spend, topUp };
}
