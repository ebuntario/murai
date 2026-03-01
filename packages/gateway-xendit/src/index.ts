// @murai-wallet/gateway-xendit
// Xendit Checkout payment gateway adapter

import { timingSafeEqual } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { GatewayError } from '@murai-wallet/core';
import type { CheckoutSession, PaymentGatewayAdapter, WebhookStatus } from '@murai-wallet/core';

export interface XenditConfig {
	secretKey: string;
	callbackToken: string;
	/** Defaults to true — must explicitly set false for production */
	sandbox?: boolean;
	/** Fetch timeout in ms — defaults to 30000 */
	timeoutMs?: number;
}

interface XenditWebhookShape {
	external_id: unknown;
	status: unknown;
	amount: unknown;
}

const statusMap: Record<string, WebhookStatus> = {
	PAID: 'success',
	SETTLED: 'success',
	EXPIRED: 'expired',
	PENDING: 'pending',
};

export function createXenditGateway(config: XenditConfig): PaymentGatewayAdapter & {
	getPaymentStatus(id: string): Promise<WebhookStatus>;
} {
	const sandbox = config.sandbox !== false;
	const baseUrl = sandbox ? 'https://api.xendit.co' : 'https://api.xendit.co';
	const timeoutMs = config.timeoutMs ?? 30000;
	const authHeader = `Basic ${btoa(`${config.secretKey}:`)}`;

	async function createCheckout(params: {
		userId: string;
		amount: number;
		successRedirectUrl: string;
		failureRedirectUrl: string;
	}): Promise<CheckoutSession> {
		const externalId = `${params.userId}-${randomUUID()}`;

		const res = await fetch(`${baseUrl}/v2/invoices`, {
			method: 'POST',
			headers: {
				Authorization: authHeader,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				external_id: externalId,
				amount: params.amount,
				success_redirect_url: params.successRedirectUrl,
				failure_redirect_url: params.failureRedirectUrl,
			}),
			signal: AbortSignal.timeout(timeoutMs),
		});

		if (!res.ok) {
			throw new GatewayError('xendit', res.status, await res.text());
		}

		const data = (await res.json()) as { invoice_url: string };

		return {
			id: externalId,
			userId: params.userId,
			amount: params.amount,
			redirectUrl: data.invoice_url,
			status: 'pending',
			createdAt: new Date(),
		};
	}

	async function verifyWebhook(_payload: unknown, signature: string): Promise<boolean> {
		if (!signature || !config.callbackToken) return false;
		try {
			const sigBuf = Buffer.from(signature);
			const tokenBuf = Buffer.from(config.callbackToken);
			if (sigBuf.length !== tokenBuf.length) return false;
			return timingSafeEqual(sigBuf, tokenBuf);
		} catch {
			return false;
		}
	}

	function parseWebhookPayload(
		payload: unknown,
	): { orderId: string; status: WebhookStatus; grossAmount: number } | null {
		if (typeof payload !== 'object' || payload === null) return null;
		const p = payload as XenditWebhookShape;

		if (typeof p.external_id !== 'string') return null;
		if (typeof p.status !== 'string') return null;
		if (typeof p.amount !== 'number' || !Number.isFinite(p.amount)) return null;

		const status = statusMap[p.status];
		if (status === undefined) return null;

		return { orderId: p.external_id, status, grossAmount: p.amount };
	}

	async function getPaymentStatus(id: string): Promise<WebhookStatus> {
		const res = await fetch(`${baseUrl}/v2/invoices?external_id=${encodeURIComponent(id)}`, {
			headers: { Authorization: authHeader },
			signal: AbortSignal.timeout(timeoutMs),
		});

		if (!res.ok) {
			throw new GatewayError('xendit', res.status, await res.text());
		}

		const invoices = (await res.json()) as { status: string }[];
		if (invoices.length === 0) {
			throw new GatewayError('xendit', undefined, `No invoice found for external_id: ${id}`);
		}

		// Use the most recent invoice
		const latest = invoices[0] as { status: string };
		const status = statusMap[latest.status];
		return status ?? 'failed';
	}

	return { createCheckout, verifyWebhook, parseWebhookPayload, getPaymentStatus };
}
