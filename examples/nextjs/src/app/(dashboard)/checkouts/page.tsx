import { StatusBadge } from '@/components/status-badge';
import { Th } from '@/components/table-header';
import { USER_ID } from '@/lib/constants';
import { formatIDR } from '@/lib/format';
import { wallet } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

export default async function CheckoutsPage() {
	const checkouts = await wallet.getCheckouts(USER_ID, { limit: 50 });

	return (
		<div>
			<h2 className="text-lg font-semibold">Checkout Sessions</h2>
			<p className="mt-1 text-sm text-gray-500">
				Payment sessions created via Midtrans Snap. Status updates when webhook fires.
			</p>

			{checkouts.length === 0 ? (
				<p className="mt-6 text-sm text-gray-400">No checkout sessions yet</p>
			) : (
				<div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
					<table className="w-full text-left text-sm">
						<thead>
							<tr className="border-b border-gray-100 bg-gray-50">
								<Th>Session ID</Th>
								<Th>Amount</Th>
								<Th>Status</Th>
								<Th>Created</Th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{checkouts.map((session) => (
								<tr key={session.id}>
									<td className="px-4 py-3 font-mono text-xs text-gray-600">
										{session.id.slice(0, 12)}...
									</td>
									<td className="px-4 py-3 font-mono">{formatIDR(session.amount)}</td>
									<td className="px-4 py-3">
										<StatusBadge status={session.status} />
									</td>
									<td className="px-4 py-3 text-xs text-gray-500">
										{session.createdAt.toLocaleString('en-US')}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
