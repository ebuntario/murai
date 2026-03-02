import { checkout } from '@/lib/wallet';
import { WebhookVerificationError } from '@murai-wallet/murai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	const body = await request.json();

	try {
		await checkout.handleWebhook({
			payload: body,
			signature: body.signature_key,
		});
		return NextResponse.json({ received: true });
	} catch (error) {
		if (error instanceof WebhookVerificationError) {
			return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
		}
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
