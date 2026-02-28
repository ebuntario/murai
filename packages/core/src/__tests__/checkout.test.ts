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

		it('credits the ledger on success status and returns credited', async () => {
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
			const result = await manager.handleWebhook(WEBHOOK);

			expect(result).toEqual({ action: 'credited' });
			await expect(storage.getBalance('user1')).resolves.toBe(100000);
		});

		it('skips on failed status and returns non_success_status', async () => {
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
					webhookPayload: { orderId: 'order-test', status: 'failed', grossAmount: 100000 },
				}),
				createLedger(storage),
				storage,
			);
			const result = await manager.handleWebhook(WEBHOOK);

			expect(result).toEqual({ action: 'skipped', reason: 'non_success_status' });
			// No credits should have been applied
			await expect(storage.getBalance('user1')).resolves.toBe(0);
			// Checkout should be marked failed
			const session = await storage.findCheckout('order-test');
			expect(session?.status).toBe('failed');
		});

		it('skips on expired status and marks checkout as failed', async () => {
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
					webhookPayload: { orderId: 'order-test', status: 'expired', grossAmount: 100000 },
				}),
				createLedger(storage),
				storage,
			);
			const result = await manager.handleWebhook(WEBHOOK);

			expect(result).toEqual({ action: 'skipped', reason: 'non_success_status' });
			const session = await storage.findCheckout('order-test');
			expect(session?.status).toBe('failed');
		});

		it('skips on pending status without updating checkout', async () => {
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
					webhookPayload: { orderId: 'order-test', status: 'pending', grossAmount: 100000 },
				}),
				createLedger(storage),
				storage,
			);
			const result = await manager.handleWebhook(WEBHOOK);

			expect(result).toEqual({ action: 'skipped', reason: 'non_success_status' });
			const session = await storage.findCheckout('order-test');
			expect(session?.status).toBe('pending');
		});

		it('skips when findCheckout returns null and returns session_not_found', async () => {
			const storage = createMockStorage();
			// No checkout saved — findCheckout will return null
			const ledger = createLedger(storage);
			const creditSpy = vi.spyOn(ledger, 'credit');
			const manager = createCheckoutManager(createMockGateway(), ledger, storage);

			const result = await manager.handleWebhook(WEBHOOK);

			expect(result).toEqual({ action: 'skipped', reason: 'session_not_found' });
			expect(creditSpy).not.toHaveBeenCalled();
		});

		it('skips when session.status is paid and returns already_processed', async () => {
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

			const result = await manager.handleWebhook(WEBHOOK);

			expect(result).toEqual({ action: 'skipped', reason: 'already_processed' });
			expect(creditSpy).not.toHaveBeenCalled();
		});

		it('returns duplicate when ledger throws IdempotencyConflictError', async () => {
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

			const result = await manager.handleWebhook(WEBHOOK);

			expect(result).toEqual({ action: 'duplicate' });
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

		it('returns unparseable when parseWebhookPayload returns null', async () => {
			const storage = createMockStorage();
			const ledger = createLedger(storage);
			const creditSpy = vi.spyOn(ledger, 'credit');
			const manager = createCheckoutManager(
				createMockGateway({ webhookPayload: null }),
				ledger,
				storage,
			);

			const result = await manager.handleWebhook(WEBHOOK);
			expect(result).toEqual({ action: 'skipped', reason: 'unparseable' });
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
