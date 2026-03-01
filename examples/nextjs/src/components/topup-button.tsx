'use client';

import { createTopUp } from '@/app/actions';
import { useFormStatus } from 'react-dom';

interface TopupButtonProps {
	userId: string;
	amount: number;
	label: string;
}

function SubmitButton({ label }: { label: string }) {
	const { pending } = useFormStatus();
	return (
		<button
			type="submit"
			disabled={pending}
			className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
		>
			{pending ? 'Opening payment...' : label}
		</button>
	);
}

export function TopupButton({ userId, amount, label }: TopupButtonProps) {
	return (
		<form action={createTopUp}>
			<input type="hidden" name="userId" value={userId} />
			<input type="hidden" name="amount" value={amount} />
			<SubmitButton label={label} />
		</form>
	);
}
