import { Hono } from 'hono';
import type { CheckoutManager } from 'token-wallet';
import { WebhookVerificationError } from 'token-wallet';

function createWebhookRoute(checkout: CheckoutManager) {
	const app = new Hono();

	app.post('/webhooks/midtrans', async (c) => {
		const body = await c.req.json();
		const signature = body.signature_key;

		try {
			const result = await checkout.handleWebhook({
				payload: body,
				signature,
			});
			return c.json(result, 200);
		} catch (error) {
			if (error instanceof WebhookVerificationError) {
				return c.json({ error: 'Invalid signature' }, 401);
			}
			throw error;
		}
	});

	return app;
}

export { createWebhookRoute };
