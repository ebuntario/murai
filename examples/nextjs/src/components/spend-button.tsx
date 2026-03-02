'use client';

import { spendTokens } from '@/app/actions';
import { AnimatePresence, motion } from 'motion/react';
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
	const [success, setSuccess] = useState(false);
	const router = useRouter();

	async function handleSubmit(formData: FormData) {
		setIsLoading(true);
		setError(null);

		const result = await spendTokens(formData);

		if (result.success) {
			setSuccess(true);
			setIsLoading(false);
			router.refresh();
			setTimeout(() => setSuccess(false), 2000);
		} else {
			setError(result.error);
			setIsLoading(false);
		}
	}

	return (
		<div>
			<form action={handleSubmit}>
				<input type="hidden" name="userId" value={userId} />
				<input type="hidden" name="amount" value={amount} />
				<motion.button
					type="submit"
					disabled={disabled || isLoading || success}
					whileTap={!disabled && !isLoading ? { scale: 0.97 } : undefined}
					className={`relative w-full overflow-hidden rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors duration-200 disabled:cursor-not-allowed ${
						success
							? 'bg-green-600'
							: 'bg-gray-900 hover:bg-gray-800 active:bg-gray-700 disabled:opacity-50'
					}`}
				>
					<AnimatePresence mode="wait" initial={false}>
						{isLoading ? (
							<motion.span
								key="loading"
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -6 }}
								transition={{ duration: 0.15 }}
								className="flex items-center justify-center gap-2"
							>
								<Spinner />
								Processing...
							</motion.span>
						) : success ? (
							<motion.span
								key="success"
								initial={{ opacity: 0, scale: 0.85 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.85 }}
								transition={{ type: 'spring', stiffness: 500, damping: 30 }}
								className="flex items-center justify-center gap-1.5"
							>
								<Checkmark />
								Spent!
							</motion.span>
						) : (
							<motion.span
								key="idle"
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -6 }}
								transition={{ duration: 0.15 }}
							>
								{label}
							</motion.span>
						)}
					</AnimatePresence>
				</motion.button>
			</form>

			<AnimatePresence>
				{error && (
					<motion.p
						initial={{ opacity: 0, height: 0, marginTop: 0 }}
						animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
						exit={{ opacity: 0, height: 0, marginTop: 0 }}
						className="overflow-hidden text-sm text-red-600"
					>
						{error}
					</motion.p>
				)}
			</AnimatePresence>

			{disabled && !isLoading && !success && (
				<p className="mt-1 text-center text-xs text-gray-400">Insufficient balance</p>
			)}
		</div>
	);
}

function Spinner() {
	return (
		<motion.svg
			aria-hidden="true"
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			animate={{ rotate: 360 }}
			transition={{ duration: 0.7, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
		>
			<circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.25" />
			<path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</motion.svg>
	);
}

function Checkmark() {
	return (
		<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
			<motion.path
				d="M3 8.5L6.5 12L13 4"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				initial={{ pathLength: 0 }}
				animate={{ pathLength: 1 }}
				transition={{ duration: 0.3, ease: 'easeOut' }}
			/>
		</svg>
	);
}
