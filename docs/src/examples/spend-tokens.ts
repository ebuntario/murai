import { InsufficientBalanceError } from 'murai';
import type { Wallet } from 'murai';

async function handleAIRequest(wallet: Wallet, userId: string, cost: number, requestId: string) {
	// 1. Check balance before calling the AI provider
	const canAfford = await wallet.canSpend(userId, cost);
	if (!canAfford) {
		return { error: 'Insufficient balance. Please top up your wallet.' };
	}

	// 2. Call your AI provider (OpenAI, Anthropic, etc.)
	const aiResponse = await callAIProvider(userId, requestId);

	// 3. Deduct tokens — idempotency key prevents double-charges on retries
	try {
		await wallet.spend(userId, cost, `ai-${requestId}`);
	} catch (error) {
		if (error instanceof InsufficientBalanceError) {
			return { error: 'Balance changed. Please try again.' };
		}
		throw error;
	}

	return { result: aiResponse };
}

// Placeholder for your AI provider call
async function callAIProvider(_userId: string, _requestId: string): Promise<string> {
	return 'AI response';
}

export { handleAIRequest };
