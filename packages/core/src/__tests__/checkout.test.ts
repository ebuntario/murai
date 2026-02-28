import { describe, expect, it, vi } from 'vitest';
import { createCheckoutManager } from '../checkout.js';
import { WebhookVerificationError } from '../errors.js';
import { createLedger } from '../ledger.js';
import type { CheckoutSession, PaymentGatewayAdapter, WebhookStatus } from '../types.js';
import { createMockStorage } from './helpers.js';

// ---------------------------------------------------------------------------
// Mock gateway factory
// ---------------------------------------------------------------------------

interface MockGatewayOptions {
	verifyResult?: boolean;
	webhookPayload?: { orderId: string; status: WebhookStatus; grossAmount: number } | null;
}

function createMockGateway(options: MockGatewayOptions = {}): PaymentGatewayAdapter {
	return {
		async createCheckout(params) {
			return {
				id: 'order-test',
				userId: params.userId,
				amount: params.amount,
				redirectUrl: 'https://example.com/pay',
				status: 'pending' as const,
				createdAt: new Date(),
			};
		},
		async verifyWebhook(_payload, _signature) {
			return options.verifyResult ?? true;
		},
		parseWebhookPayload(_payload) {
			if (options.webhookPayload === null) return null;
			return (
				options.webhookPayload ?? {
					orderId: 'order-test',
					status: 'success' as const,
					grossAmount: 100000,
				}
			);
		},
	};
}

// Minimal valid webhook call payload
const WEBHOOK = { payload: { raw: true }, signature: 'sig' };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createCheckoutManager', () => {
	describe('createSession', () => {
		it('persists the checkout via storage.saveCheckout', async () => {
			const storage = createMockStorage();
			const saveSpy = vi.spyOn(storage, 'saveCheckout');
			const gateway = createMockGateway();
			const ledger = createLedger(storage);
			const manager = createCheckoutManager(gateway, ledger, storage);

			const session = await manager.createSession({
				userId: 'user1',
				amount: 100000,
				successRedirectUrl: 'https://example.com/success',
				failureRedirectUrl: 'https://example.com/fail',
			});

			expect(saveSpy).toHaveBeenCalledOnce();
			expect(saveSpy).toHaveBeenCalledWith(session);
		});
	});

	describe('handleWebhook', () => {
		it('throws WebhookVerificationError on bad signature', async () => {
			const storage = createMockStorage();
			const manager = createCheckoutManager(
				createMockGateway({ verifyResult: false }),
				createLedger(storage),
				storage,
			);
			await expect(manager.handleWebhook(WEBHOOK)).rejects.toThrow(WebhookVerificationError);
		});

		it('credits the ledger on success status', async () => {
			const storage = createMockStorage();
			await storage.saveCheckout({
				id: 'order-test',
				userId: 'user1',
				amount: 100000,
				redirectUrl: 'https://example.com/pay',
				status: 'pending',
				createdAt: new Date(),
			} satisfies CheckoutSession);

			const manager = createCheckoutManager(createMockGateway(), createLedger(storage), storage);
			await manager.handleWebhook(WEBHOOK);

			await expect(storage.getBalance('user1')).resolves.toBe(100000);
		});

		it.each(['failed', 'expired', 'pending'] as const)(
			'skips silently on %s status',
			async (status) => {
				const storage = createMockStorage();
				await storage.saveCheckout({
					id: 'order-test',
					userId: 'user1',
					amount: 100000,
					redirectUrl: 'https://example.com/pay',
					status: 'pending',
					createdAt: new Date(),
				} satisfies CheckoutSession);

				const manager = createCheckoutManager(
					createMockGateway({
						webhookPayload: { orderId: 'order-test', status, grossAmount: 100000 },
					}),
					createLedger(storage),
					storage,
				);
				await manager.handleWebhook(WEBHOOK);

				// No credits should have been applied
				await expect(storage.getBalance('user1')).resolves.toBe(0);
			},
		);

		it('skips silently when findCheckout returns null', async () => {
			const storage = createMockStorage();
			// No checkout saved — findCheckout will return null
			const ledger = createLedger(storage);
			const creditSpy = vi.spyOn(ledger, 'credit');
			const manager = createCheckoutManager(createMockGateway(), ledger, storage);

			await manager.handleWebhook(WEBHOOK);

			expect(creditSpy).not.toHaveBeenCalled();
		});

		it('skips silently when session.status is paid (primary idempotency)', async () => {
			const storage = createMockStorage();
			await storage.saveCheckout({
				id: 'order-test',
				userId: 'user1',
				amount: 100000,
				redirectUrl: 'https://example.com/pay',
				status: 'paid',
				createdAt: new Date(),
			} satisfies CheckoutSession);

			const ledger = createLedger(storage);
			const creditSpy = vi.spyOn(ledger, 'credit');
			const manager = createCheckoutManager(createMockGateway(), ledger, storage);

			await manager.handleWebhook(WEBHOOK);

			expect(creditSpy).not.toHaveBeenCalled();
		});

		it('is idempotent: still calls updateCheckoutStatus when ledger throws IdempotencyConflictError', async () => {
			const storage = createMockStorage();
			// Save checkout as pending (status update failed on prior delivery)
			await storage.saveCheckout({
				id: 'order-test',
				userId: 'user1',
				amount: 100000,
				redirectUrl: 'https://example.com/pay',
				status: 'pending',
				createdAt: new Date(),
			} satisfies CheckoutSession);
			// Pre-populate ledger entry so credit will throw IdempotencyConflictError
			await storage.appendEntry({
				userId: 'user1',
				amount: 100000,
				idempotencyKey: 'webhook:order-test',
			});

			const updateSpy = vi.spyOn(storage, 'updateCheckoutStatus');
			const manager = createCheckoutManager(createMockGateway(), createLedger(storage), storage);

			await manager.handleWebhook(WEBHOOK);

			expect(updateSpy).toHaveBeenCalledWith('order-test', 'paid');
		});

		it('uses derived idempotency key webhook:{orderId}', async () => {
			const storage = createMockStorage();
			await storage.saveCheckout({
				id: 'order-test',
				userId: 'user1',
				amount: 100000,
				redirectUrl: 'https://example.com/pay',
				status: 'pending',
				createdAt: new Date(),
			} satisfies CheckoutSession);

			const capturedKeys: string[] = [];
			const realLedger = createLedger(storage);
			const ledger = {
				...realLedger,
				credit: async (userId: string, amount: number, idempotencyKey: string) => {
					capturedKeys.push(idempotencyKey);
					return realLedger.credit(userId, amount, idempotencyKey);
				},
			};

			const manager = createCheckoutManager(createMockGateway(), ledger, storage);
			await manager.handleWebhook(WEBHOOK);

			expect(capturedKeys).toEqual(['webhook:order-test']);
		});

		it('marks checkout as paid after crediting ledger', async () => {
			const storage = createMockStorage();
			await storage.saveCheckout({
				id: 'order-test',
				userId: 'user1',
				amount: 100000,
				redirectUrl: 'https://example.com/pay',
				status: 'pending',
				createdAt: new Date(),
			} satisfies CheckoutSession);

			const manager = createCheckoutManager(createMockGateway(), createLedger(storage), storage);
			await manager.handleWebhook(WEBHOOK);

			const session = await storage.findCheckout('order-test');
			expect(session?.status).toBe('paid');
		});

		it('returns null from parseWebhookPayload — skips silently', async () => {
			const storage = createMockStorage();
			const ledger = createLedger(storage);
			const creditSpy = vi.spyOn(ledger, 'credit');
			const manager = createCheckoutManager(
				createMockGateway({ webhookPayload: null }),
				ledger,
				storage,
			);

			await expect(manager.handleWebhook(WEBHOOK)).resolves.toBeUndefined();
			expect(creditSpy).not.toHaveBeenCalled();
		});

		it('re-throws non-IdempotencyConflictError from ledger.credit', async () => {
			const storage = createMockStorage();
			await storage.saveCheckout({
				id: 'order-test',
				userId: 'user1',
				amount: 100000,
				redirectUrl: 'https://example.com/pay',
				status: 'pending',
				createdAt: new Date(),
			} satisfies CheckoutSession);

			const unexpectedError = new Error('unexpected DB error');
			const ledger = {
				...createLedger(storage),
				credit: async () => {
					throw unexpectedError;
				},
			};

			const manager = createCheckoutManager(createMockGateway(), ledger, storage);
			await expect(manager.handleWebhook(WEBHOOK)).rejects.toThrow(unexpectedError);
		});
	});
});
