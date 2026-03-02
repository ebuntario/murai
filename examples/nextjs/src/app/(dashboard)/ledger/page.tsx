import { Th } from '@/components/table-header';
import { USER_ID } from '@/lib/constants';
import { formatIDR } from '@/lib/format';
import { wallet } from '@/lib/wallet';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const filterTabs = [
	{ label: 'All', href: '/ledger' },
	{ label: 'Credits', href: '/ledger?type=credit' },
	{ label: 'Debits', href: '/ledger?type=debit' },
] as const;

export default async function LedgerPage({
	searchParams,
}: {
	searchParams: Promise<{ type?: string }>;
}) {
	const params = await searchParams;
	const typeFilter = params.type === 'credit' || params.type === 'debit' ? params.type : undefined;

	const transactions = await wallet.getTransactions(USER_ID, {
		limit: 100,
		type: typeFilter,
	});

	return (
		<div>
			<h2 className="text-lg font-semibold">Ledger</h2>
			<p className="mt-1 text-sm text-gray-500">
				Append-only transaction log. Credits include bucket expiry fields.
			</p>

			<div className="mt-4 flex gap-4">
				{filterTabs.map((tab) => {
					const isActive =
						tab.href === '/ledger'
							? typeFilter === undefined
							: tab.href === `/ledger?type=${typeFilter}`;
					return (
						<Link
							key={tab.href}
							href={tab.href}
							className={`text-sm font-medium transition-colors ${
								isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
							}`}
						>
							{tab.label}
						</Link>
					);
				})}
			</div>

			{transactions.length === 0 ? (
				<p className="mt-6 text-sm text-gray-400">No transactions found</p>
			) : (
				<div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
					<table className="w-full text-left text-sm">
						<thead>
							<tr className="border-b border-gray-100 bg-gray-50">
								<Th>Type</Th>
								<Th>Amount</Th>
								<Th>Remaining</Th>
								<Th>Expires</Th>
								<Th>Expired At</Th>
								<Th>Idempotency Key</Th>
								<Th>Created</Th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{transactions.map((tx) => {
								const isCredit = tx.amount > 0;
								return (
									<tr key={tx.id}>
										<td className="px-4 py-3">
											<span
												className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
													isCredit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
												}`}
											>
												{isCredit ? 'credit' : 'debit'}
											</span>
										</td>
										<td
											className={`px-4 py-3 font-mono ${isCredit ? 'text-green-600' : 'text-red-600'}`}
										>
											{isCredit ? '+' : ''}
											{formatIDR(Math.abs(tx.amount))}
										</td>
										<td className="px-4 py-3 font-mono text-xs text-gray-600">
											{tx.remaining != null ? formatIDR(tx.remaining) : '-'}
										</td>
										<td className="px-4 py-3 text-xs text-gray-500">
											{tx.expiresAt ? tx.expiresAt.toLocaleString('en-US') : '-'}
										</td>
										<td className="px-4 py-3 text-xs text-gray-500">
											{tx.expiredAt ? tx.expiredAt.toLocaleString('en-US') : '-'}
										</td>
										<td className="px-4 py-3 font-mono text-xs text-gray-600">
											{tx.idempotencyKey.slice(0, 12)}...
										</td>
										<td className="px-4 py-3 text-xs text-gray-500">
											{tx.createdAt.toLocaleString('en-US')}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
