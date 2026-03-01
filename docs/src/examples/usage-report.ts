import { drizzle } from 'drizzle-orm/postgres-js';
import { createDrizzleStorage, createWallet } from 'murai';
import postgres from 'postgres';

// biome-ignore lint/style/noNonNullAssertion: env vars validated at startup
const sql = postgres(process.env.DATABASE_URL!);
const storage = createDrizzleStorage(drizzle(sql));
const wallet = createWallet({ storage });

// Spend with provider cost metadata
await wallet.spend('user_123', 500, 'ai-req-001', {
	metadata: JSON.stringify({ cost: 0.05, model: 'gpt-4o' }),
});

// Generate a usage report for the past 30 days
const report = await wallet.getUsageReport('user_123', {
	from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
	to: new Date(),
});

console.log(`Credits: ${report.totalCredits}`);
console.log(`Debits: ${report.totalDebits}`);
console.log(`Provider cost: $${report.totalProviderCost.toFixed(4)}`);
console.log(`Transactions: ${report.transactionCount}`);
