'use client';

import { AnimatePresence, motion } from 'motion/react';

interface AnimatedFeedbackProps {
	message: string | null;
	className?: string;
}

export function AnimatedFeedback({ message, className = 'text-red-600' }: AnimatedFeedbackProps) {
	return (
		<AnimatePresence>
			{message && (
				<motion.p
					initial={{ opacity: 0, height: 0, marginTop: 0 }}
					animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
					exit={{ opacity: 0, height: 0, marginTop: 0 }}
					className={`overflow-hidden text-sm ${className}`}
				>
					{message}
				</motion.p>
			)}
		</AnimatePresence>
	);
}
