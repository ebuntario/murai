'use server';

import { randomUUID } from 'node:crypto';
import { checkout, wallet } from '@/lib/wallet';
import { InsufficientBalanceError } from '@murai-wallet/murai';
import { redirect } from 'next/navigation';

export async function createTopUp(formData: FormData) {
	const userId = formData.get('userId') as string;
	const amount = Number(formData.get('amount'));

	const session = await checkout.createSession({
		userId,
		amount,
		successRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
		failureRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
	});

	redirect(session.redirectUrl);
}

export async function spendTokens(formData: FormData) {
	const userId = formData.get('userId') as string;
	const amount = Number(formData.get('amount'));

	try {
		await wallet.spend(userId, amount, `spend-${randomUUID()}`);
		return { success: true, error: null };
	} catch (error) {
		if (error instanceof InsufficientBalanceError) {
			return { success: false, error: 'Insufficient balance. Please top up.' };
		}
		throw error;
	}
}
