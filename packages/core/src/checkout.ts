// Payment gateway abstraction and webhook handling

import { WebhookVerificationError } from './errors.js';
import type { Ledger } from './ledger.js';
import type { CheckoutSession, PaymentGatewayAdapter, StorageAdapter } from './types.js';

export interface CheckoutManager {
	createSession(params: {
		userId: string;
		amount: number;
		successRedirectUrl: string;
		failureRedirectUrl: string;
	}): Promise<CheckoutSession>;
	handleWebhook(params: {
		payload: unknown;
		signature: string;
		idempotencyKey: string;
	}): Promise<void>;
}

export function createCheckoutManager(
	gateway: PaymentGatewayAdapter,
	ledger: Ledger,
	_storage: StorageAdapter,
): CheckoutManager {
	async function createSession(params: {
		userId: string;
		amount: number;
		successRedirectUrl: string;
		failureRedirectUrl: string;
	}): Promise<CheckoutSession> {
		return gateway.createCheckout(params);
	}

	async function handleWebhook(params: {
		payload: unknown;
		signature: string;
		idempotencyKey: string;
	}): Promise<void> {
		const valid = gateway.verifyWebhook(params.payload, params.signature);
		if (!valid) {
			throw new WebhookVerificationError();
		}
		// TODO: parse payload, extract userId + amount, credit the ledger
		void ledger;
	}

	return { createSession, handleWebhook };
}
