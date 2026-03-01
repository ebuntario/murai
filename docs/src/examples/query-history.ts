import type { Wallet } from 'murai';

async function getUserDashboard(wallet: Wallet, userId: string) {
	// Current balance
	const balance = await wallet.getBalance(userId);

	// Recent transactions (credits and debits)
	const recentTransactions = await wallet.getTransactions(userId, {
		limit: 20,
	});

	// Only debits (spending history)
	const spendingHistory = await wallet.getTransactions(userId, {
		limit: 10,
		type: 'debit',
	});

	// Checkout history (top-ups)
	const topUpHistory = await wallet.getCheckouts(userId, {
		status: 'paid',
		limit: 10,
	});

	return { balance, recentTransactions, spendingHistory, topUpHistory };
}

export { getUserDashboard };
