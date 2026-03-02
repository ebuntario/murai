'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';

const tabs = [
	{ label: 'Wallet', href: '/' },
	{ label: 'Checkouts', href: '/checkouts' },
	{ label: 'Ledger', href: '/ledger' },
	{ label: 'Raw DB', href: '/raw' },
] as const;

export function DashboardNav() {
	const pathname = usePathname();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	return (
		<nav className="relative flex gap-6 border-b border-gray-200">
			{tabs.map((tab) => {
				const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
				return (
					<Link
						key={tab.href}
						href={tab.href}
						onClick={(e) => {
							e.preventDefault();
							startTransition(() => {
								router.push(tab.href);
							});
						}}
						className={`pb-3 text-sm font-medium transition-colors ${
							isActive
								? 'border-b-2 border-blue-600 text-blue-600'
								: 'text-gray-500 hover:text-gray-900'
						} ${isPending ? 'pointer-events-none' : ''}`}
					>
						{tab.label}
					</Link>
				);
			})}
			{isPending && (
				<div className="absolute -bottom-px left-0 h-0.5 w-full overflow-hidden">
					<div className="h-full w-1/3 animate-[shimmer_1s_ease-in-out_infinite] bg-blue-500" />
				</div>
			)}
		</nav>
	);
}
