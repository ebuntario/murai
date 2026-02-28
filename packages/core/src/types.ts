// Public TypeScript interfaces for @token-wallet/core

export type WebhookStatus = 'success' | 'failed' | 'pending' | 'expired';

export type WebhookAction = 'credited' | 'skipped' | 'duplicate';

export type WebhookSkipReason =
	| 'unparseable'
	| 'non_success_status'
	| 'session_not_found'
	| 'already_processed';

export interface WebhookResult {
	action: WebhookAction;
	reason?: WebhookSkipReason;
}

export interface WalletConfig {
	storage: StorageAdapter;
}

export interface TransactionQuery {
	limit?: number;
	offset?: number;
	type?: 'credit' | 'debit';
}

export interface CheckoutQuery {
	limit?: number;
	offset?: number;
	status?: CheckoutSession['status'];
}

export interface Wallet {
	getBalance(userId: string): Promise<number>;
	canSpend(userId: string, amount: number): Promise<boolean>;
	spend(userId: string, amount: number, idempotencyKey: string): Promise<void>;
	topUp(userId: string, amount: number, idempotencyKey: string): Promise<void>;
	getTransactions(userId: string, query?: TransactionQuery): Promise<LedgerEntry[]>;
	getCheckouts(userId: string, query?: CheckoutQuery): Promise<CheckoutSession[]>;
}

export interface LedgerEntry {
	id: string;
	userId: string;
	/** Positive = credit, negative = debit */
	amount: number;
	idempotencyKey: string;
	createdAt: Date;
}

export interface CheckoutSession {
	id: string;
	userId: string;
	amount: number;
	redirectUrl: string;
	status: 'pending' | 'paid' | 'failed';
	createdAt: Date;
}

export interface StorageAdapter {
	getBalance(userId: string): Promise<number>;
	/**
	 * Appends a ledger entry atomically.
	 * Implementations MUST:
	 *  - Enforce idempotency key uniqueness (UNIQUE constraint or equivalent)
	 *  - For negative amounts (debit): throw InsufficientBalanceError if balance < |amount|
	 *  - Lock the wallet row (SELECT FOR UPDATE or equivalent) before reading balance
	 */
	appendEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry>;
	findEntry(idempotencyKey: string): Promise<LedgerEntry | null>;
	saveCheckout(session: CheckoutSession): Promise<CheckoutSession>;
	findCheckout(id: string): Promise<CheckoutSession | null>;
	updateCheckoutStatus(id: string, status: CheckoutSession['status']): Promise<void>;
	/** Optional — paginated transaction history */
	getTransactions?(userId: string, query?: TransactionQuery): Promise<LedgerEntry[]>;
	/** Optional — paginated checkout history */
	getCheckouts?(userId: string, query?: CheckoutQuery): Promise<CheckoutSession[]>;
}

export interface PaymentGatewayAdapter {
	createCheckout(params: {
		userId: string;
		amount: number;
		successRedirectUrl: string;
		failureRedirectUrl: string;
	}): Promise<CheckoutSession>;
	verifyWebhook(payload: unknown, signature: string): Promise<boolean>;
	parseWebhookPayload(
		payload: unknown,
	): { orderId: string; status: WebhookStatus; grossAmount: number } | null;
	/** Optional — poll gateway for payment status */
	getPaymentStatus?(id: string): Promise<WebhookStatus>;
}
