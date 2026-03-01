import { createHmac } from 'node:crypto';
import { GatewayError } from '@murai/core';
import { describe, expect, it, vi } from 'vitest';
import { createStripeGateway } from '../index.js';

const SECRET_KEY = 'sk_test_abc123';
const WEBHOOK_SECRET = 'whsec_test_secret_123';
const gateway = createStripeGateway({ secretKey: SECRET_KEY, webhookSecret: WEBHOOK_SECRET });

// Helper: compute valid Stripe webhook signature
function computeSignature(rawBody: string, timestamp?: number): string {
	const ts = timestamp ?? Math.floor(Date.now() / 1000);
	const sig = createHmac('sha256', WEBHOOK_SECRET).update(`${ts}.${rawBody}`).digest('hex');
	return `t=${ts},v1=${sig}`;
}

const VALID_RAW_BODY = JSON.stringify({
	type: 'checkout.session.completed',
	data: {
		object: {
			metadata: { order_id: 'user1-session-abc' },
			amount_total: 100000,
		},
	},
});

const VALID_PAYLOAD = JSON.parse(VALID_RAW_BODY);

describe('createStripeGateway', () => {
	describe('verifyWebhook', () => {
		it('resolves true for valid HMAC-SHA256 signature', async () => {
			const signature = computeSignature(VALID_RAW_BODY);
			await expect(gateway.verifyWebhook(VALID_PAYLOAD, signature, VALID_RAW_BODY)).resolves.toBe(
				true,
			);
		});

		it('resolves false for invalid signature', async () => {
			const signature = 't=1234567890,v1=invalidsignaturehex';
			await expect(gateway.verifyWebhook(VALID_PAYLOAD, signature, VALID_RAW_BODY)).resolves.toBe(
				false,
			);
		});

		it('resolves false for tampered payload', async () => {
			const signature = computeSignature(VALID_RAW_BODY);
			const tamperedBody = JSON.stringify({ tampered: true });
			await expect(gateway.verifyWebhook(VALID_PAYLOAD, signature, tamperedBody)).resolves.toBe(
				false,
			);
		});

		it('resolves false for wrong webhook secret', async () => {
			const wrongGateway = createStripeGateway({
				secretKey: SECRET_KEY,
				webhookSecret: 'wrong-secret',
			});
			const signature = computeSignature(VALID_RAW_BODY);
			await expect(
				wrongGateway.verifyWebhook(VALID_PAYLOAD, signature, VALID_RAW_BODY),
			).resolves.toBe(false);
		});

		it('throws GatewayError when rawBody is missing', async () => {
			const signature = computeSignature(VALID_RAW_BODY);
			await expect(gateway.verifyWebhook(VALID_PAYLOAD, signature)).rejects.toThrow(GatewayError);
		});

		it('resolves false for expired timestamp (>5min)', async () => {
			const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 6+ min ago
			const signature = computeSignature(VALID_RAW_BODY, oldTimestamp);
			await expect(gateway.verifyWebhook(VALID_PAYLOAD, signature, VALID_RAW_BODY)).resolves.toBe(
				false,
			);
		});

		it('resolves false for malformed signature header', async () => {
			await expect(
				gateway.verifyWebhook(VALID_PAYLOAD, 'malformed-header', VALID_RAW_BODY),
			).resolves.toBe(false);
		});
	});

	describe('parseWebhookPayload', () => {
		it('returns success for checkout.session.completed', () => {
			const result = gateway.parseWebhookPayload(VALID_PAYLOAD);
			expect(result).toEqual({
				orderId: 'user1-session-abc',
				status: 'success',
				grossAmount: 100000,
			});
		});

		it('returns expired for checkout.session.expired', () => {
			const result = gateway.parseWebhookPayload({
				type: 'checkout.session.expired',
				data: {
					object: {
						metadata: { order_id: 'user1-session-xyz' },
						amount_total: 50000,
					},
				},
			});
			expect(result).toEqual({
				orderId: 'user1-session-xyz',
				status: 'expired',
				grossAmount: 50000,
			});
		});

		it('returns null for unrecognized event type', () => {
			expect(
				gateway.parseWebhookPayload({
					type: 'payment_intent.succeeded',
					data: { object: {} },
				}),
			).toBeNull();
		});

		it('returns null for non-object payload', () => {
			expect(gateway.parseWebhookPayload('string')).toBeNull();
		});

		it('returns null for null payload', () => {
			expect(gateway.parseWebhookPayload(null)).toBeNull();
		});

		it('returns null for missing metadata.order_id', () => {
			expect(
				gateway.parseWebhookPayload({
					type: 'checkout.session.completed',
					data: {
						object: {
							metadata: {},
							amount_total: 100000,
						},
					},
				}),
			).toBeNull();
		});

		it('returns null for non-finite amount_total', () => {
			expect(
				gateway.parseWebhookPayload({
					type: 'checkout.session.completed',
					data: {
						object: {
							metadata: { order_id: 'order-1' },
							amount_total: 'not-a-number',
						},
					},
				}),
			).toBeNull();
		});
	});

	describe('createCheckout', () => {
		it('calls Stripe API and returns CheckoutSession', async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_abc' }),
			};
			const fetchSpy = vi
				.spyOn(globalThis, 'fetch')
				.mockResolvedValueOnce(mockResponse as Response);

			const session = await gateway.createCheckout({
				userId: 'user1',
				amount: 100000,
				successRedirectUrl: 'https://example.com/success',
				failureRedirectUrl: 'https://example.com/cancel',
			});

			expect(fetchSpy).toHaveBeenCalledOnce();
			expect(session.id).toMatch(/^user1-/);
			expect(session.userId).toBe('user1');
			expect(session.amount).toBe(100000);
			expect(session.redirectUrl).toBe('https://checkout.stripe.com/c/pay/cs_test_abc');
			expect(session.status).toBe('pending');

			// Verify it uses Bearer auth, not Basic
			const callArgs = fetchSpy.mock.calls[0];
			const headers = callArgs?.[1]?.headers as { Authorization: string };
			expect(headers.Authorization).toBe(`Bearer ${SECRET_KEY}`);

			fetchSpy.mockRestore();
		});

		it('throws GatewayError on non-ok response', async () => {
			const mockResponse = {
				ok: false,
				status: 400,
				text: async () => 'Bad Request',
			};
			const fetchSpy = vi
				.spyOn(globalThis, 'fetch')
				.mockResolvedValueOnce(mockResponse as Response);

			await expect(
				gateway.createCheckout({
					userId: 'user1',
					amount: 100000,
					successRedirectUrl: 'https://example.com/success',
					failureRedirectUrl: 'https://example.com/cancel',
				}),
			).rejects.toThrow(GatewayError);

			fetchSpy.mockRestore();
		});
	});

	describe('getPaymentStatus', () => {
		it.each([
			['paid', 'success'] as const,
			['unpaid', 'pending'] as const,
			['no_payment_required', 'success'] as const,
		])('maps payment_status "%s" to "%s"', async (paymentStatus, expected) => {
			const mockResponse = {
				ok: true,
				json: async () => ({ payment_status: paymentStatus }),
			};
			const fetchSpy = vi
				.spyOn(globalThis, 'fetch')
				.mockResolvedValueOnce(mockResponse as Response);

			const status = await gateway.getPaymentStatus('cs_test_abc');
			expect(status).toBe(expected);
			expect(fetchSpy).toHaveBeenCalledOnce();

			fetchSpy.mockRestore();
		});

		it('returns failed for unknown payment_status', async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({ payment_status: 'unknown_status' }),
			};
			const fetchSpy = vi
				.spyOn(globalThis, 'fetch')
				.mockResolvedValueOnce(mockResponse as Response);

			const status = await gateway.getPaymentStatus('cs_test_abc');
			expect(status).toBe('failed');

			fetchSpy.mockRestore();
		});

		it('throws GatewayError on non-ok response', async () => {
			const mockResponse = {
				ok: false,
				status: 404,
				text: async () => 'Not Found',
			};
			const fetchSpy = vi
				.spyOn(globalThis, 'fetch')
				.mockResolvedValueOnce(mockResponse as Response);

			await expect(gateway.getPaymentStatus('cs_test_abc')).rejects.toThrow(GatewayError);

			fetchSpy.mockRestore();
		});
	});
});
