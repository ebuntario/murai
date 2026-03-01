'use client';

import { spendTokens } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SpendButtonProps {
	userId: string;
	amount: number;
	label: string;
	disabled?: boolean;
}

export function SpendButton({ userId, amount, label, disabled }: SpendButtonProps) {
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	async function handleSubmit(formData: FormData) {
		setIsLoading(true);
		setError(null);

		const result = await spendTokens(formData);

		if (result.success) {
			router.refresh();
		} else {
			setError(result.error);
		}

		setIsLoading(false);
	}

	return (
		<div>
			<form action={handleSubmit}>
				<input type="hidden" name="userId" value={userId} />
				<input type="hidden" name="amount" value={amount} />
				<button
					type="submit"
					disabled={disabled || isLoading}
					title={disabled ? 'Insufficient balance' : undefined}
					className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 active:bg-gray-700 disabled:opacity-50"
				>
					{isLoading ? 'Processing...' : label}
				</button>
			</form>
			{error && <p className="mt-2 text-sm text-red-600">{error}</p>}
		</div>
	);
}
