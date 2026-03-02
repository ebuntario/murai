import { formatIDR } from '@/lib/format';

interface BalanceDisplayProps {
	balance: number;
}

export function BalanceDisplay({ balance }: BalanceDisplayProps) {
	return (
		<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
			<p className="text-sm font-medium text-gray-500">Current Balance</p>
			<p className="mt-2 font-mono text-4xl font-bold tracking-tight">{formatIDR(balance)}</p>
		</div>
	);
}
