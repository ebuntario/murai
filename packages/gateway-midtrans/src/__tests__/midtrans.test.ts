import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createMidtransGateway } from '../index.js';

const SERVER_KEY = 'test-server-key-abc123';
const CLIENT_KEY = 'test-client-key-xyz789';
const gateway = createMidtransGateway({ serverKey: SERVER_KEY, clientKey: CLIENT_KEY });

// Helper: compute valid Midtrans SHA512 signature
function computeSignature(orderId: string, statusCode: string, grossAmount: string): string {
	return createHash('sha512')
		.update(orderId + statusCode + grossAmount + SERVER_KEY)
		.digest('hex');
}

const VALID_PAYLOAD = {
	order_id: 'user-123-session-abc',
	status_code: '200',
	gross_amount: '100000.00',
	transaction_status: 'settlement',
};
const VALID_SIGNATURE = computeSignature(
	VALID_PAYLOAD.order_id,
	VALID_PAYLOAD.status_code,
	VALID_PAYLOAD.gross_amount,
);

describe('createMidtransGateway', () => {
	describe('verifyWebhook', () => {
		it('resolves true for valid SHA512 signature', async () => {
			await expect(gateway.verifyWebhook(VALID_PAYLOAD, VALID_SIGNATURE)).resolves.toBe(true);
		});

		it('resolves false for tampered gross_amount', async () => {
			const tamperedPayload = { ...VALID_PAYLOAD, gross_amount: '999999.00' };
			await expect(gateway.verifyWebhook(tamperedPayload, VALID_SIGNATURE)).resolves.toBe(false);
		});

		it('resolves false for wrong server key', async () => {
			const wrongKeyGateway = createMidtransGateway({
				serverKey: 'wrong-key',
				clientKey: CLIENT_KEY,
			});
			await expect(wrongKeyGateway.verifyWebhook(VALID_PAYLOAD, VALID_SIGNATURE)).resolves.toBe(
				false,
			);
		});

		it('resolves false for non-object payload', async () => {
			await expect(gateway.verifyWebhook('not-an-object', VALID_SIGNATURE)).resolves.toBe(false);
		});

		it('resolves false for null payload', async () => {
			await expect(gateway.verifyWebhook(null, VALID_SIGNATURE)).resolves.toBe(false);
		});

		it('resolves false for payload missing order_id', async () => {
			const { order_id: _removed, ...withoutOrderId } = VALID_PAYLOAD;
			await expect(gateway.verifyWebhook(withoutOrderId, VALID_SIGNATURE)).resolves.toBe(false);
		});
	});

	describe('parseWebhookPayload', () => {
		it('returns null for non-object payload', () => {
			expect(gateway.parseWebhookPayload('string')).toBeNull();
		});

		it('returns null for null payload', () => {
			expect(gateway.parseWebhookPayload(null)).toBeNull();
		});

		it('returns null for missing order_id', () => {
			expect(
				gateway.parseWebhookPayload({ transaction_status: 'settlement', gross_amount: '100' }),
			).toBeNull();
		});

		it('returns null for missing transaction_status', () => {
			expect(gateway.parseWebhookPayload({ order_id: 'order-1', gross_amount: '100' })).toBeNull();
		});

		it('returns null for unknown transaction_status', () => {
			expect(
				gateway.parseWebhookPayload({
					order_id: 'order-1',
					transaction_status: 'refund',
					gross_amount: '100',
				}),
			).toBeNull();
		});

		it('returns null for non-finite gross_amount', () => {
			expect(
				gateway.parseWebhookPayload({
					order_id: 'order-1',
					transaction_status: 'settlement',
					gross_amount: 'not-a-number',
				}),
			).toBeNull();
		});

		it.each([
			['settlement', 'success'] as const,
			['capture', 'success'] as const,
			['cancel', 'failed'] as const,
			['deny', 'failed'] as const,
			['expire', 'expired'] as const,
			['pending', 'pending'] as const,
		])('maps transaction_status "%s" to WebhookStatus "%s"', (transactionStatus, expected) => {
			const result = gateway.parseWebhookPayload({
				order_id: 'order-1',
				transaction_status: transactionStatus,
				gross_amount: '100000.00',
			});
			expect(result).not.toBeNull();
			expect(result?.status).toBe(expected);
		});

		it('returns correct orderId and grossAmount for valid payload', () => {
			const result = gateway.parseWebhookPayload({
				order_id: 'order-abc',
				transaction_status: 'settlement',
				gross_amount: '75000.50',
			});
			expect(result).toEqual({
				orderId: 'order-abc',
				status: 'success',
				grossAmount: 75000.5,
			});
		});
	});
});
