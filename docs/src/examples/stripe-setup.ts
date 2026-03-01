import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
	createCheckoutManager,
	createDrizzleStorage,
	createLedger,
	createStripeGateway,
	createWallet,
} from 'token-wallet';

// biome-ignore lint/style/noNonNullAssertion: env vars validated at startup
const sql = postgres(process.env.DATABASE_URL!);
const storage = createDrizzleStorage(drizzle(sql));

const gateway = createStripeGateway({
	// biome-ignore lint/style/noNonNullAssertion: env vars validated at startup
	secretKey: process.env.STRIPE_SECRET_KEY!,
	// biome-ignore lint/style/noNonNullAssertion: env vars validated at startup
	webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
});

const wallet = createWallet({ storage });
const ledger = createLedger(storage);
const checkout = createCheckoutManager(gateway, ledger, storage);

export { wallet, checkout };
