// @token-wallet/gateway-midtrans
// Midtrans Snap payment gateway adapter

import { createHash, randomUUID } from 'node:crypto';
import { GatewayError } from '@token-wallet/core';
import type { CheckoutSession, PaymentGatewayAdapter, WebhookStatus } from '@token-wallet/core';

export interface MidtransConfig {
	serverKey: string;
	clientKey: string;
	/** Defaults to true — must explicitly set false for production */
	sandbox?: boolean;
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

export function createMidtransGateway(config: MidtransConfig): PaymentGatewayAdapter {
	const sandbox = config.sandbox !== false;
	const baseHost = sandbox ? 'app.sandbox.midtrans.com' : 'app.midtrans.com';
	const authHeader = `Basic ${btoa(`${config.serverKey}:`)}`;

	async function createCheckout(params: {
		userId: string;
		amount: number;
		successRedirectUrl: string;
		failureRedirectUrl: string;
	}): Promise<CheckoutSession> {
		const sessionId = randomUUID();
		const orderId = `${params.userId}-${sessionId}`;

		const res = await fetch(`https://${baseHost}/snap/v1/transactions`, {
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
		});

		if (!res.ok) {
			throw new GatewayError('midtrans', res.status, await res.text());
		}

		const data = (await res.json()) as { token: string };
		const redirectUrl = `https://${baseHost}/snap/v2/vtweb/${data.token}`;

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

		// TypeScript has narrowed the types to string after the guards above
		const hash = createHash('sha512')
			.update(p.order_id + p.status_code + p.gross_amount + config.serverKey)
			.digest('hex');
		return hash === signature;
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

		const statusMap: Record<string, WebhookStatus> = {
			settlement: 'success',
			capture: 'success',
			cancel: 'failed',
			deny: 'failed',
			expire: 'expired',
			pending: 'pending',
		};

		const status = statusMap[p.transaction_status];
		if (status === undefined) return null;

		return { orderId: p.order_id, status, grossAmount };
	}

	return { createCheckout, verifyWebhook, parseWebhookPayload };
}
