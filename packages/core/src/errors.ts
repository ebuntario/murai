// Typed error hierarchy for @murai-wallet/core

export abstract class MuraiError extends Error {
	abstract readonly code: string;

	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class InsufficientBalanceError extends MuraiError {
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

export class IdempotencyConflictError extends MuraiError {
	readonly code = 'IDEMPOTENCY_CONFLICT';

	constructor(public readonly idempotencyKey: string) {
		super(`Idempotency key already used: ${idempotencyKey}`);
	}
}

export class WebhookVerificationError extends MuraiError {
	readonly code = 'WEBHOOK_VERIFICATION_FAILED';

	constructor(message = 'Webhook signature verification failed') {
		super(message);
	}
}

export class InvalidAmountError extends MuraiError {
	readonly code = 'INVALID_AMOUNT';

	constructor(public readonly amount: number) {
		super(`Amount must be a positive integer, got: ${amount}`);
	}
}

export class InvalidExpirationError extends MuraiError {
	readonly code = 'INVALID_EXPIRATION';

	constructor(public readonly expiresAt: Date) {
		super(`Expiration date must be in the future, got: ${expiresAt.toISOString()}`);
	}
}

export class InvalidMetadataError extends MuraiError {
	readonly code = 'INVALID_METADATA';

	constructor(public readonly reason: string) {
		super(`Invalid metadata: ${reason}`);
	}
}

export class GatewayError extends MuraiError {
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
