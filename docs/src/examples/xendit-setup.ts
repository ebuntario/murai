import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
	createCheckoutManager,
	createDrizzleStorage,
	createLedger,
	createWallet,
	createXenditGateway,
} from 'token-wallet';

// Xendit uses a callback token instead of signature hashing
const gateway = createXenditGateway({
	// biome-ignore lint/style/noNonNullAssertion: env vars validated at startup
	secretKey: process.env.XENDIT_SECRET_KEY!,
	// biome-ignore lint/style/noNonNullAssertion: env vars validated at startup
	callbackToken: process.env.XENDIT_CALLBACK_TOKEN!,
	sandbox: true,
});

// biome-ignore lint/style/noNonNullAssertion: env vars validated at startup
const sql = postgres(process.env.DATABASE_URL!);
const storage = createDrizzleStorage(drizzle(sql));
const wallet = createWallet({ storage });
const ledger = createLedger(storage);
const checkout = createCheckoutManager(gateway, ledger, storage);

export { wallet, checkout };
