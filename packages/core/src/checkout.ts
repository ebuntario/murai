// Payment gateway abstraction and webhook handling

import { IdempotencyConflictError, WebhookVerificationError } from './errors.js';
import type { Ledger } from './ledger.js';
import type {
	CheckoutSession,
	PaymentGatewayAdapter,
	StorageAdapter,
	WebhookResult,
} from './types.js';

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
		rawBody?: string | Buffer;
	}): Promise<WebhookResult>;
}

export function createCheckoutManager(
	gateway: PaymentGatewayAdapter,
	ledger: Ledger,
	storage: StorageAdapter,
): CheckoutManager {
	async function createSession(params: {
		userId: string;
		amount: number;
		successRedirectUrl: string;
		failureRedirectUrl: string;
	}): Promise<CheckoutSession> {
		const session = await gateway.createCheckout(params);
		await storage.saveCheckout(session);
		return session;
	}

	async function handleWebhook(params: {
		payload: unknown;
		signature: string;
		rawBody?: string | Buffer;
	}): Promise<WebhookResult> {
		// 1. Verify signature
		const valid = await gateway.verifyWebhook(params.payload, params.signature, params.rawBody);
		if (!valid) {
			throw new WebhookVerificationError();
		}

		// 2. Parse payload (null = unrecognized gateway event, skip silently)
		const parsed = gateway.parseWebhookPayload(params.payload);
		if (parsed === null) return { action: 'skipped', reason: 'unparseable' };

		// 3. Handle non-success statuses
		if (parsed.status !== 'success') {
			// Update checkout status to 'failed' for expired/failed webhooks
			if (parsed.status === 'expired' || parsed.status === 'failed') {
				const session = await storage.findCheckout(parsed.orderId);
				if (session && session.status === 'pending') {
					await storage.updateCheckoutStatus(parsed.orderId, 'failed');
				}
			}
			return { action: 'skipped', reason: 'non_success_status' };
		}

		// 4. Find the checkout session (null = unknown order, skip silently)
		const session = await storage.findCheckout(parsed.orderId);
		if (session === null) return { action: 'skipped', reason: 'session_not_found' };

		// 5. Primary idempotency guard — already processed
		if (session.status !== 'pending') return { action: 'skipped', reason: 'already_processed' };

		// 6. Credit the ledger (idempotency key derived internally)
		const idempotencyKey = `webhook:${parsed.orderId}`;
		try {
			await ledger.credit(session.userId, session.amount, idempotencyKey);
		} catch (err) {
			if (err instanceof IdempotencyConflictError) {
				// Secondary guard: ledger already credited (e.g. status update failed on prior delivery)
				// Fall through to update status for eventual consistency
				await storage.updateCheckoutStatus(parsed.orderId, 'paid');
				return { action: 'duplicate' };
			}
			throw err;
		}

		// 7. Mark checkout as paid
		await storage.updateCheckoutStatus(parsed.orderId, 'paid');
		return { action: 'credited' };
	}

	return { createSession, handleWebhook };
}
