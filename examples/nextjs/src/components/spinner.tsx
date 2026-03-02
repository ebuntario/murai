'use client';

import { motion } from 'motion/react';

export function Spinner() {
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
