import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
	createCheckoutManager,
	createDrizzleStorage,
	createLedger,
	createMidtransGateway,
	createWallet,
} from 'token-wallet';

// 1. Storage — connect to PostgreSQL via Drizzle
// biome-ignore lint/style/noNonNullAssertion: env vars validated at startup
const sql = postgres(process.env.DATABASE_URL!);
const storage = createDrizzleStorage(drizzle(sql));

// 2. Gateway — Midtrans Snap (sandbox mode)
const gateway = createMidtransGateway({
	// biome-ignore lint/style/noNonNullAssertion: env vars validated at startup
	serverKey: process.env.MIDTRANS_SERVER_KEY!,
	// biome-ignore lint/style/noNonNullAssertion: env vars validated at startup
	clientKey: process.env.MIDTRANS_CLIENT_KEY!,
	sandbox: true,
});

// 3. Wallet — balance queries and spending
const wallet = createWallet({ storage });

// 4. Ledger + Checkout — top-ups via payment gateway
const ledger = createLedger(storage);
const checkout = createCheckoutManager(gateway, ledger, storage);

export { wallet, checkout };
