import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createDrizzleStorage, createWallet } from 'token-wallet';

// biome-ignore lint/style/noNonNullAssertion: env vars validated at startup
const sql = postgres(process.env.DATABASE_URL!);
const storage = createDrizzleStorage(drizzle(sql));
const wallet = createWallet({ storage });

// Top up with 30-day expiration
const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
await wallet.topUp('user_123', 10_000, 'purchase-abc', {
	expiresAt: thirtyDays,
});

// Spend consumes earliest-expiring bucket first
await wallet.spend('user_123', 2_000, 'usage-xyz');

// Run this via cron (e.g., daily) to expire old credits
const result = await wallet.expireTokens('user_123');
console.log(`Expired ${result.expiredCount} buckets, ${result.expiredAmount} tokens`);
