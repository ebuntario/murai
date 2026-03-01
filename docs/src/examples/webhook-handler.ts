import type { CheckoutManager, WebhookResult } from 'murai';

// Example: Express / Hono / any framework
async function handleMidtransWebhook(
	body: unknown,
	signatureKey: string,
	checkout: CheckoutManager,
): Promise<{ status: number; body: WebhookResult | { error: string } }> {
	try {
		const result = await checkout.handleWebhook({
			payload: body,
			signature: signatureKey,
		});

		// result.action: 'credited' | 'skipped' | 'duplicate'
		return { status: 200, body: result };
	} catch (error) {
		// WebhookVerificationError → 401
		if (error instanceof Error && error.name === 'WebhookVerificationError') {
			return { status: 401, body: { error: 'Invalid signature' } };
		}
		throw error;
	}
}

export { handleMidtransWebhook };
