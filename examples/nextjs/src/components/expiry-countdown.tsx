'use client';

import { expireTokens } from '@/app/actions';
import { formatIDR } from '@/lib/format';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface ExpiringBucket {
	amount: number;
	expiresAt: string; // ISO string (serialized from server)
}

interface ExpiryCountdownProps {
	userId: string;
	buckets: ExpiringBucket[];
}

export function ExpiryCountdown({ userId, buckets }: ExpiryCountdownProps) {
	const [now, setNow] = useState(() => Date.now());
	const router = useRouter();
	const sweepingRef = useRef(false);

	const activeBuckets = buckets.filter((b) => new Date(b.expiresAt).getTime() > now);
	const totalExpiring = activeBuckets.reduce((sum, b) => sum + b.amount, 0);
	const earliestExpiry = activeBuckets.reduce((earliest, b) => {
		const t = new Date(b.expiresAt).getTime();
		return t < earliest ? t : earliest;
	}, Number.POSITIVE_INFINITY);

	const secondsLeft = Math.max(0, Math.ceil((earliestExpiry - now) / 1000));

	useEffect(() => {
		if (activeBuckets.length === 0) return;

		const interval = setInterval(() => {
			const current = Date.now();
			setNow(current);

			// Auto-sweep when a bucket expires
			const anyExpired = buckets.some((b) => new Date(b.expiresAt).getTime() <= current);
			if (anyExpired && !sweepingRef.current) {
				sweepingRef.current = true;
				const formData = new FormData();
				formData.set('userId', userId);
				expireTokens(formData).finally(() => {
					sweepingRef.current = false;
					router.refresh();
				});
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [activeBuckets.length, buckets, userId, router]);

	if (activeBuckets.length === 0) return null;

	return (
		<p className="text-xs text-amber-600">
			{formatIDR(totalExpiring)} expiring in {secondsLeft}s ({activeBuckets.length}{' '}
			{activeBuckets.length === 1 ? 'bucket' : 'buckets'})
		</p>
	);
}
