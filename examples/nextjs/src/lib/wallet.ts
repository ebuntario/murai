import {
	createCheckoutManager,
	createDrizzleStorage,
	createLedger,
	createMidtransGateway,
	createWallet,
} from '@murai-wallet/murai';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Singleton pattern for development hot reloading
const globalForDb = globalThis as unknown as {
	sql: ReturnType<typeof postgres>;
};

// biome-ignore lint/style/noNonNullAssertion: validated below
export const sql = globalForDb.sql ?? postgres(process.env.DATABASE_URL!);
if (process.env.NODE_ENV === 'development') {
	globalForDb.sql = sql;
}

const db = drizzle(sql);
const storage = createDrizzleStorage(db);

const gateway = createMidtransGateway({
	// biome-ignore lint/style/noNonNullAssertion: validated below
	serverKey: process.env.MIDTRANS_SERVER_KEY!,
	// biome-ignore lint/style/noNonNullAssertion: validated below
	clientKey: process.env.MIDTRANS_CLIENT_KEY!,
	sandbox: true,
});

export const wallet = createWallet({ storage });
const ledger = createLedger(storage);
export const checkout = createCheckoutManager(gateway, ledger, storage);
