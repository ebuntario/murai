'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
	{ label: 'Wallet', href: '/' },
	{ label: 'Checkouts', href: '/checkouts' },
	{ label: 'Ledger', href: '/ledger' },
	{ label: 'Raw DB', href: '/raw' },
] as const;

export function DashboardNav() {
	const pathname = usePathname();

	return (
		<nav className="flex gap-6 border-b border-gray-200">
			{tabs.map((tab) => {
				const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
				return (
					<Link
						key={tab.href}
						href={tab.href}
						className={`pb-3 text-sm font-medium transition-colors ${
							isActive
								? 'border-b-2 border-blue-600 text-blue-600'
								: 'text-gray-500 hover:text-gray-900'
						}`}
					>
						{tab.label}
					</Link>
				);
			})}
		</nav>
	);
}
