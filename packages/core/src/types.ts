// Public TypeScript interfaces for @token-wallet/core

export interface WalletConfig {
	storage: StorageAdapter;
}

export interface Wallet {
	getBalance(userId: string): Promise<number>;
	canSpend(userId: string, amount: number): Promise<boolean>;
	spend(userId: string, amount: number, idempotencyKey: string): Promise<void>;
	topUp(userId: string, amount: number, idempotencyKey: string): Promise<void>;
}

export interface LedgerEntry {
	id: string;
	userId: string;
	/** Positive = credit, negative = debit */
	amount: number;
	idempotencyKey: string;
	createdAt: Date;
}

export interface StorageAdapter {
	getBalance(userId: string): Promise<number>;
	appendEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry>;
	findEntry(idempotencyKey: string): Promise<LedgerEntry | null>;
}

export interface CheckoutSession {
	id: string;
	userId: string;
	amount: number;
	redirectUrl: string;
	status: 'pending' | 'paid' | 'failed';
}

export interface PaymentGatewayAdapter {
	createCheckout(params: {
		userId: string;
		amount: number;
		successRedirectUrl: string;
		failureRedirectUrl: string;
	}): Promise<CheckoutSession>;
	verifyWebhook(payload: unknown, signature: string): boolean;
}
