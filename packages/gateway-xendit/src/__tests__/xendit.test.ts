import { GatewayError } from '@murai-wallet/core';
import { describe, expect, it, vi } from 'vitest';
import { createXenditGateway } from '../index.js';

const SECRET_KEY = 'xnd_test_secret_key_123';
const CALLBACK_TOKEN = 'test-callback-token-abc';
const gateway = createXenditGateway({ secretKey: SECRET_KEY, callbackToken: CALLBACK_TOKEN });

// ---------------------------------------------------------------------------
// verifyWebhook
// ---------------------------------------------------------------------------

describe('createXenditGateway', () => {
	describe('verifyWebhook', () => {
		it('resolves true when signature matches callback token', async () => {
			await expect(gateway.verifyWebhook({}, CALLBACK_TOKEN)).resolves.toBe(true);
		});

		it('resolves false when signature does not match callback token', async () => {
			await expect(gateway.verifyWebhook({}, 'wrong-token')).resolves.toBe(false);
		});

		it('resolves false when signature is empty', async () => {
			await expect(gateway.verifyWebhook({}, '')).resolves.toBe(false);
		});

		it('resolves false when signature length differs from callback token', async () => {
			await expect(gateway.verifyWebhook({}, 'short')).resolves.toBe(false);
		});

		it('uses timing-safe comparison (does not short-circuit)', async () => {
			// Construct a token that differs only in the last character
			const almostRight = `${CALLBACK_TOKEN.slice(0, -1)}Z`;
			await expect(gateway.verifyWebhook({}, almostRight)).resolves.toBe(false);
		});
	});

	// ---------------------------------------------------------------------------
	// parseWebhookPayload
	// ---------------------------------------------------------------------------

	describe('parseWebhookPayload', () => {
		it('returns null for non-object payload', () => {
			expect(gateway.parseWebhookPayload('string')).toBeNull();
		});

		it('returns null for null payload', () => {
			expect(gateway.parseWebhookPayload(null)).toBeNull();
		});

		it('returns null for missing external_id', () => {
			expect(gateway.parseWebhookPayload({ status: 'PAID', amount: 100000 })).toBeNull();
		});

		it('returns null for missing status', () => {
			expect(gateway.parseWebhookPayload({ external_id: 'order-1', amount: 100000 })).toBeNull();
		});

		it('returns null for unknown status', () => {
			expect(
				gateway.parseWebhookPayload({
					external_id: 'order-1',
					status: 'REFUNDED',
					amount: 100000,
				}),
			).toBeNull();
		});

		it('returns null for non-number amount', () => {
			expect(
				gateway.parseWebhookPayload({
					external_id: 'order-1',
					status: 'PAID',
					amount: 'not-a-number',
				}),
			).toBeNull();
		});

		it.each([
			['PAID', 'success'] as const,
			['SETTLED', 'success'] as const,
			['EXPIRED', 'expired'] as const,
			['PENDING', 'pending'] as const,
		])('maps status "%s" to WebhookStatus "%s"', (xenditStatus, expected) => {
			const result = gateway.parseWebhookPayload({
				external_id: 'user1-uuid-abc',
				status: xenditStatus,
				amount: 100000,
			});
			expect(result).not.toBeNull();
			expect(result?.status).toBe(expected);
		});

		it('returns correct orderId and grossAmount', () => {
			const result = gateway.parseWebhookPayload({
				external_id: 'user1-uuid-abc',
				status: 'PAID',
				amount: 75000,
			});
			expect(result).toEqual({
				orderId: 'user1-uuid-abc',
				status: 'success',
				grossAmount: 75000,
			});
		});
	});

	// ---------------------------------------------------------------------------
	// createCheckout (mocked fetch)
	// ---------------------------------------------------------------------------

	describe('createCheckout', () => {
		it('sends requests to api.xendit.co regardless of sandbox flag', async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({ invoice_url: 'https://checkout.xendit.co/web/abc123' }),
			};
			const fetchSpy = vi
				.spyOn(globalThis, 'fetch')
				.mockResolvedValueOnce(mockResponse as Response);

			await gateway.createCheckout({
				userId: 'user1',
				amount: 100000,
				successRedirectUrl: 'https://example.com/success',
				failureRedirectUrl: 'https://example.com/fail',
			});

			const calledUrl = fetchSpy.mock.calls[0]?.[0] as string;
			expect(calledUrl).toBe('https://api.xendit.co/v2/invoices');

			fetchSpy.mockRestore();
		});

		it('calls Xendit API and returns CheckoutSession with external_id as id', async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({ invoice_url: 'https://checkout.xendit.co/web/abc123' }),
			};
			const fetchSpy = vi
				.spyOn(globalThis, 'fetch')
				.mockResolvedValueOnce(mockResponse as Response);

			const session = await gateway.createCheckout({
				userId: 'user1',
				amount: 100000,
				successRedirectUrl: 'https://example.com/success',
				failureRedirectUrl: 'https://example.com/fail',
			});

			expect(fetchSpy).toHaveBeenCalledOnce();
			expect(session.id).toMatch(/^user1-/);
			expect(session.userId).toBe('user1');
			expect(session.amount).toBe(100000);
			expect(session.redirectUrl).toBe('https://checkout.xendit.co/web/abc123');
			expect(session.status).toBe('pending');

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
					failureRedirectUrl: 'https://example.com/fail',
				}),
			).rejects.toThrow(GatewayError);

			fetchSpy.mockRestore();
		});
	});

	// ---------------------------------------------------------------------------
	// getPaymentStatus (mocked fetch)
	// ---------------------------------------------------------------------------

	describe('getPaymentStatus', () => {
		it('returns mapped status for valid invoice', async () => {
			const mockResponse = {
				ok: true,
				json: async () => [{ status: 'PAID' }],
			};
			const fetchSpy = vi
				.spyOn(globalThis, 'fetch')
				.mockResolvedValueOnce(mockResponse as Response);

			const status = await gateway.getPaymentStatus('user1-uuid-abc');
			expect(status).toBe('success');

			fetchSpy.mockRestore();
		});

		it('returns failed for unknown xendit status', async () => {
			const mockResponse = {
				ok: true,
				json: async () => [{ status: 'UNKNOWN_STATUS' }],
			};
			const fetchSpy = vi
				.spyOn(globalThis, 'fetch')
				.mockResolvedValueOnce(mockResponse as Response);

			const status = await gateway.getPaymentStatus('user1-uuid-abc');
			expect(status).toBe('failed');

			fetchSpy.mockRestore();
		});

		it('throws GatewayError when no invoice found', async () => {
			const mockResponse = {
				ok: true,
				json: async () => [],
			};
			const fetchSpy = vi
				.spyOn(globalThis, 'fetch')
				.mockResolvedValueOnce(mockResponse as Response);

			await expect(gateway.getPaymentStatus('nonexistent')).rejects.toThrow(GatewayError);

			fetchSpy.mockRestore();
		});

		it('throws GatewayError on non-ok response', async () => {
			const mockResponse = {
				ok: false,
				status: 401,
				text: async () => 'Unauthorized',
			};
			const fetchSpy = vi
				.spyOn(globalThis, 'fetch')
				.mockResolvedValueOnce(mockResponse as Response);

			await expect(gateway.getPaymentStatus('user1-uuid-abc')).rejects.toThrow(GatewayError);

			fetchSpy.mockRestore();
		});
	});
});
