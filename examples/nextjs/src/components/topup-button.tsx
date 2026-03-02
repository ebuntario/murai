'use client';

import { createTopUp } from '@/app/actions';
import { Spinner } from '@/components/spinner';
import { motion } from 'motion/react';
import { useFormStatus } from 'react-dom';

interface TopupButtonProps {
	userId: string;
	amount: number;
	label: string;
}

function SubmitButton({ label }: { label: string }) {
	const { pending } = useFormStatus();
	return (
		<motion.button
			type="submit"
			disabled={pending}
			whileTap={!pending ? { scale: 0.97 } : undefined}
			className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{pending ? (
				<span className="flex items-center justify-center gap-2">
					<Spinner />
					Opening payment...
				</span>
			) : (
				label
			)}
		</motion.button>
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
