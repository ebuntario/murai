'use server';

import { randomUUID } from 'node:crypto';
import { checkout, wallet } from '@/lib/wallet';
import { InsufficientBalanceError } from '@murai-wallet/murai';
import { redirect } from 'next/navigation';

function parseFormFields(formData: FormData) {
	return {
		userId: formData.get('userId') as string,
		amount: Number(formData.get('amount')),
	};
}

export async function createTopUp(formData: FormData) {
	const { userId, amount } = parseFormFields(formData);

	const session = await checkout.createSession({
		userId,
		amount,
		successRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
		failureRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
	});

	redirect(session.redirectUrl);
}

export async function createExpiringTopUp(formData: FormData) {
	const { userId, amount } = parseFormFields(formData);
	const expiresAt = new Date(Date.now() + 30 * 1000); // 30 seconds

	await wallet.topUp(userId, amount, `expiring-topup-${randomUUID()}`, { expiresAt });
}

export async function expireTokens(formData: FormData) {
	const userId = formData.get('userId') as string;
	const result = await wallet.expireTokens(userId);
	return { expiredCount: result.expiredCount, expiredAmount: result.expiredAmount };
}

export async function spendTokens(formData: FormData) {
	const { userId, amount } = parseFormFields(formData);

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
