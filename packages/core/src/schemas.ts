// Zod validation schemas for @token-wallet/core
// Requires: zod (add to dependencies before implementing)

export type SpendParams = {
	userId: string;
	amount: number;
	idempotencyKey: string;
};

export type TopUpParams = {
	userId: string;
	amount: number;
	idempotencyKey: string;
};

export type CheckoutParams = {
	userId: string;
	amount: number;
	successRedirectUrl: string;
	failureRedirectUrl: string;
};
