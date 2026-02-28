// Typed error hierarchy for @token-wallet/core

export abstract class TokenWalletError extends Error {
	abstract readonly code: string;

	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class InsufficientBalanceError extends TokenWalletError {
	readonly code = 'INSUFFICIENT_BALANCE';

	constructor(
		public readonly userId: string,
		public readonly requested: number,
		public readonly available: number,
	) {
		super(
			`Insufficient balance for user ${userId}: requested ${requested}, available ${available}`,
		);
	}
}

export class IdempotencyConflictError extends TokenWalletError {
	readonly code = 'IDEMPOTENCY_CONFLICT';

	constructor(public readonly idempotencyKey: string) {
		super(`Idempotency key already used: ${idempotencyKey}`);
	}
}

export class WebhookVerificationError extends TokenWalletError {
	readonly code = 'WEBHOOK_VERIFICATION_FAILED';

	constructor(message = 'Webhook signature verification failed') {
		super(message);
	}
}

export class InvalidAmountError extends TokenWalletError {
	readonly code = 'INVALID_AMOUNT';

	constructor(public readonly amount: number) {
		super(`Amount must be a positive integer, got: ${amount}`);
	}
}

export class GatewayError extends TokenWalletError {
	readonly code = 'GATEWAY_ERROR';

	constructor(
		public readonly gatewayName: string,
		public readonly httpStatus: number | undefined,
		public readonly gatewayMessage: string,
		cause?: unknown,
	) {
		super(`${gatewayName} error: ${gatewayMessage}`);
		this.cause = cause;
	}
}
