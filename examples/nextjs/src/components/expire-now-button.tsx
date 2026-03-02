'use client';

import { expireTokens } from '@/app/actions';
import { AnimatedFeedback } from '@/components/animated-feedback';
import { Spinner } from '@/components/spinner';
import { formatIDR } from '@/lib/format';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ExpireNowButtonProps {
	userId: string;
}

export function ExpireNowButton({ userId }: ExpireNowButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<string | null>(null);
	const router = useRouter();

	async function handleSubmit(formData: FormData) {
		setIsLoading(true);
		setResult(null);

		try {
			const res = await expireTokens(formData);
			setIsLoading(false);
			if (res.expiredCount === 0) {
				setResult('No expired credits found');
			} else {
				setResult(
					`Expired ${res.expiredCount} bucket${res.expiredCount > 1 ? 's' : ''} (${formatIDR(res.expiredAmount)})`,
				);
			}
			router.refresh();
			setTimeout(() => setResult(null), 4000);
		} catch {
			setResult('Failed to expire tokens');
			setIsLoading(false);
		}
	}

	return (
		<div>
			<form action={handleSubmit}>
				<input type="hidden" name="userId" value={userId} />
				<motion.button
					type="submit"
					disabled={isLoading}
					whileTap={!isLoading ? { scale: 0.97 } : undefined}
					className="w-full rounded-lg border border-red-300 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isLoading ? (
						<span className="flex items-center justify-center gap-2">
							<Spinner />
							Expiring...
						</span>
					) : (
						'Expire Now'
					)}
				</motion.button>
			</form>

			<AnimatedFeedback message={result} className="text-center text-gray-600" />
		</div>
	);
}
