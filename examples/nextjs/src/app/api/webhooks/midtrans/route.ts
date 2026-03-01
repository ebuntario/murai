import { checkout } from '@/lib/wallet';
import { WebhookVerificationError } from 'murai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	const body = await request.json();

	try {
		const result = await checkout.handleWebhook({
			payload: body,
			signature: body.signature_key,
		});
		return NextResponse.json(result);
	} catch (error) {
		if (error instanceof WebhookVerificationError) {
			return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
		}
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
