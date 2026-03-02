'use client';

import { createExpiringTopUp } from '@/app/actions';
import { AnimatedFeedback } from '@/components/animated-feedback';
import { Spinner } from '@/components/spinner';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ExpiringTopupButtonProps {
	userId: string;
	amount: number;
	label: string;
}

export function ExpiringTopupButton({ userId, amount, label }: ExpiringTopupButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	async function handleSubmit(formData: FormData) {
		setIsLoading(true);
		setError(null);

		try {
			await createExpiringTopUp(formData);
			setSuccess(true);
			setIsLoading(false);
			router.refresh();
			setTimeout(() => setSuccess(false), 2000);
		} catch {
			setError('Top-up failed');
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
					disabled={isLoading || success}
					whileTap={!isLoading ? { scale: 0.97 } : undefined}
					className={`w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors duration-200 disabled:cursor-not-allowed ${
						success
							? 'bg-green-600'
							: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50'
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
								Adding...
							</motion.span>
						) : success ? (
							<motion.span
								key="success"
								initial={{ opacity: 0, scale: 0.85 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.85 }}
								transition={{ type: 'spring', stiffness: 500, damping: 30 }}
							>
								Added!
							</motion.span>
						) : (
							<motion.span
								key="idle"
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -6 }}
								transition={{ duration: 0.15 }}
							>
								{label} (5 min)
							</motion.span>
						)}
					</AnimatePresence>
				</motion.button>
			</form>

			<AnimatedFeedback message={error} />
		</div>
	);
}
