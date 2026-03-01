// @murai/gateway-midtrans
// Midtrans Snap payment gateway adapter

import { createHash, timingSafeEqual } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { GatewayError } from '@murai/core';
import type { CheckoutSession, PaymentGatewayAdapter, WebhookStatus } from '@murai/core';

export interface MidtransConfig {
	serverKey: string;
	clientKey: string;
	/** Defaults to true — must explicitly set false for production */
	sandbox?: boolean;
	/** Fetch timeout in ms — defaults to 30000 */
	timeoutMs?: number;
}

// Minimal typed shapes — no index signatures, so dot notation satisfies both
// TypeScript's noPropertyAccessFromIndexSignature and Biome's useLiteralKeys.
interface MidtransVerifyShape {
	order_id: unknown;
	status_code: unknown;
	gross_amount: unknown;
}

interface MidtransWebhookShape {
	order_id: unknown;
	transaction_status: unknown;
	gross_amount: unknown;
}

const statusMap: Record<string, WebhookStatus> = {
	settlement: 'success',
	capture: 'success',
	cancel: 'failed',
	deny: 'failed',
	expire: 'expired',
	pending: 'pending',
};

export function createMidtransGateway(config: MidtransConfig): PaymentGatewayAdapter & {
	getPaymentStatus(orderId: string): Promise<WebhookStatus>;
} {
	const sandbox = config.sandbox !== false;
	const snapHost = sandbox ? 'app.sandbox.midtrans.com' : 'app.midtrans.com';
	const apiHost = sandbox ? 'api.sandbox.midtrans.com' : 'api.midtrans.com';
	const timeoutMs = config.timeoutMs ?? 30000;
	const authHeader = `Basic ${btoa(`${config.serverKey}:`)}`;

	async function createCheckout(params: {
		userId: string;
		amount: number;
		successRedirectUrl: string;
		failureRedirectUrl: string;
	}): Promise<CheckoutSession> {
		const sessionId = randomUUID();
		const orderId = `${params.userId}-${sessionId}`;

		const res = await fetch(`https://${snapHost}/snap/v1/transactions`, {
			method: 'POST',
			headers: {
				Authorization: authHeader,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				transaction_details: {
					order_id: orderId,
					gross_amount: params.amount,
				},
				callbacks: {
					finish: params.successRedirectUrl,
					error: params.failureRedirectUrl,
					pending: params.failureRedirectUrl,
				},
			}),
			signal: AbortSignal.timeout(timeoutMs),
		});

		if (!res.ok) {
			throw new GatewayError('midtrans', res.status, await res.text());
		}

		const data = (await res.json()) as { token: string };
		const redirectUrl = `https://${snapHost}/snap/v2/vtweb/${data.token}`;

		return {
			id: orderId,
			userId: params.userId,
			amount: params.amount,
			redirectUrl,
			status: 'pending',
			createdAt: new Date(),
		};
	}

	async function verifyWebhook(payload: unknown, signature: string): Promise<boolean> {
		if (typeof payload !== 'object' || payload === null) return false;
		const p = payload as MidtransVerifyShape;
		if (typeof p.order_id !== 'string') return false;
		if (typeof p.status_code !== 'string') return false;
		if (typeof p.gross_amount !== 'string') return false;

		const hash = createHash('sha512')
			.update(p.order_id + p.status_code + p.gross_amount + config.serverKey)
			.digest('hex');

		// Timing-safe comparison to prevent timing attacks
		const hashBuf = Buffer.from(hash, 'hex');
		const sigBuf = Buffer.from(signature, 'hex');
		if (hashBuf.length !== sigBuf.length) return false;
		return timingSafeEqual(hashBuf, sigBuf);
	}

	function parseWebhookPayload(
		payload: unknown,
	): { orderId: string; status: WebhookStatus; grossAmount: number } | null {
		if (typeof payload !== 'object' || payload === null) return null;
		const p = payload as MidtransWebhookShape;

		if (typeof p.order_id !== 'string') return null;
		if (typeof p.transaction_status !== 'string') return null;
		if (typeof p.gross_amount !== 'string') return null;

		const grossAmount = Number(p.gross_amount);
		if (!Number.isFinite(grossAmount)) return null;

		const status = statusMap[p.transaction_status];
		if (status === undefined) return null;

		return { orderId: p.order_id, status, grossAmount };
	}

	async function getPaymentStatus(orderId: string): Promise<WebhookStatus> {
		const res = await fetch(`https://${apiHost}/v2/${encodeURIComponent(orderId)}/status`, {
			headers: {
				Authorization: authHeader,
				Accept: 'application/json',
			},
			signal: AbortSignal.timeout(timeoutMs),
		});

		if (!res.ok) {
			throw new GatewayError('midtrans', res.status, await res.text());
		}

		const data = (await res.json()) as { transaction_status: string };
		const status = statusMap[data.transaction_status];
		return status ?? 'failed';
	}

	return { createCheckout, verifyWebhook, parseWebhookPayload, getPaymentStatus };
}
