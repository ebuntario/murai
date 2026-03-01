// @murai-wallet/gateway-stripe
// Stripe Checkout payment gateway adapter

import { createHmac, timingSafeEqual } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { GatewayError } from '@murai-wallet/core';
import type { CheckoutSession, PaymentGatewayAdapter, WebhookStatus } from '@murai-wallet/core';

export interface StripeConfig {
	secretKey: string;
	webhookSecret: string;
	/** Fetch timeout in ms — defaults to 30000 */
	timeoutMs?: number;
}

interface StripeSignatureParts {
	timestamp: string;
	signatures: string[];
}

const STRIPE_TIMESTAMP_TOLERANCE_SECONDS = 300; // 5 minutes

function parseStripeSignature(header: string): StripeSignatureParts | null {
	const parts = header.split(',');
	let timestamp = '';
	const signatures: string[] = [];

	for (const part of parts) {
		const [key, value] = part.split('=');
		if (!key || !value) return null;
		if (key === 't') {
			timestamp = value;
		} else if (key === 'v1') {
			signatures.push(value);
		}
	}

	if (!timestamp || signatures.length === 0) return null;
	return { timestamp, signatures };
}

const statusMap: Record<string, WebhookStatus> = {
	paid: 'success',
	no_payment_required: 'success',
	unpaid: 'pending',
};

export function createStripeGateway(config: StripeConfig): PaymentGatewayAdapter & {
	getPaymentStatus(sessionId: string): Promise<WebhookStatus>;
} {
	const timeoutMs = config.timeoutMs ?? 30000;
	const authHeader = `Bearer ${config.secretKey}`;

	async function createCheckout(params: {
		userId: string;
		amount: number;
		successRedirectUrl: string;
		failureRedirectUrl: string;
	}): Promise<CheckoutSession> {
		const orderId = `${params.userId}-${randomUUID()}`;

		const body = new URLSearchParams({
			mode: 'payment',
			success_url: params.successRedirectUrl,
			cancel_url: params.failureRedirectUrl,
			'line_items[0][price_data][currency]': 'usd',
			'line_items[0][price_data][unit_amount]': String(params.amount),
			'line_items[0][price_data][product_data][name]': 'Token Top-Up',
			'line_items[0][quantity]': '1',
			'metadata[order_id]': orderId,
		});

		const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
			method: 'POST',
			headers: {
				Authorization: authHeader,
				'Content-Type': 'application/x-www-form-urlencoded',
				'Idempotency-Key': orderId,
			},
			body: body.toString(),
			signal: AbortSignal.timeout(timeoutMs),
		});

		if (!res.ok) {
			throw new GatewayError('stripe', res.status, await res.text());
		}

		const data = (await res.json()) as { url: string };

		return {
			id: orderId,
			userId: params.userId,
			amount: params.amount,
			redirectUrl: data.url,
			status: 'pending',
			createdAt: new Date(),
		};
	}

	async function verifyWebhook(
		_payload: unknown,
		signature: string,
		rawBody?: string | Buffer,
	): Promise<boolean> {
		if (!rawBody) {
			throw new GatewayError(
				'stripe',
				undefined,
				'rawBody is required for Stripe webhook verification',
			);
		}

		const parsed = parseStripeSignature(signature);
		if (!parsed) return false;

		// Check timestamp tolerance
		const timestampSeconds = Number(parsed.timestamp);
		if (!Number.isFinite(timestampSeconds)) return false;

		const nowSeconds = Math.floor(Date.now() / 1000);
		if (Math.abs(nowSeconds - timestampSeconds) > STRIPE_TIMESTAMP_TOLERANCE_SECONDS) {
			return false;
		}

		// Compute expected signature
		const signedPayload = `${parsed.timestamp}.${typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8')}`;
		const expectedSig = createHmac('sha256', config.webhookSecret)
			.update(signedPayload)
			.digest('hex');

		// Timing-safe compare against any v1 signature
		const expectedBuf = Buffer.from(expectedSig, 'hex');
		for (const sig of parsed.signatures) {
			try {
				const sigBuf = Buffer.from(sig, 'hex');
				if (sigBuf.length !== expectedBuf.length) continue;
				if (timingSafeEqual(sigBuf, expectedBuf)) return true;
			} catch {
				// invalid hex — skip
			}
		}

		return false;
	}

	function parseWebhookPayload(
		payload: unknown,
	): { orderId: string; status: WebhookStatus; grossAmount: number } | null {
		if (typeof payload !== 'object' || payload === null) return null;

		const event = payload as {
			type: unknown;
			data: unknown;
		};
		if (typeof event.type !== 'string') return null;

		if (event.type === 'checkout.session.completed') {
			const data = event.data as { object: unknown } | undefined;
			if (!data || typeof data.object !== 'object' || data.object === null) return null;

			const session = data.object as {
				metadata: unknown;
				amount_total: unknown;
			};

			const metadata = session.metadata as { order_id: unknown } | undefined;
			if (!metadata || typeof metadata.order_id !== 'string') return null;

			const amountTotal = session.amount_total;
			if (typeof amountTotal !== 'number' || !Number.isFinite(amountTotal)) return null;

			return {
				orderId: metadata.order_id,
				status: 'success',
				grossAmount: amountTotal,
			};
		}

		if (event.type === 'checkout.session.expired') {
			const data = event.data as { object: unknown } | undefined;
			if (!data || typeof data.object !== 'object' || data.object === null) return null;

			const session = data.object as {
				metadata: unknown;
				amount_total: unknown;
			};

			const metadata = session.metadata as { order_id: unknown } | undefined;
			if (!metadata || typeof metadata.order_id !== 'string') return null;

			const amountTotal = session.amount_total;
			if (typeof amountTotal !== 'number' || !Number.isFinite(amountTotal)) return null;

			return {
				orderId: metadata.order_id,
				status: 'expired',
				grossAmount: amountTotal,
			};
		}

		// Unrecognized event type
		return null;
	}

	async function getPaymentStatus(sessionId: string): Promise<WebhookStatus> {
		const res = await fetch(
			`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
			{
				headers: {
					Authorization: authHeader,
					Accept: 'application/json',
				},
				signal: AbortSignal.timeout(timeoutMs),
			},
		);

		if (!res.ok) {
			throw new GatewayError('stripe', res.status, await res.text());
		}

		const data = (await res.json()) as { payment_status: string };
		const status = statusMap[data.payment_status];
		return status ?? 'failed';
	}

	return { createCheckout, verifyWebhook, parseWebhookPayload, getPaymentStatus };
}
