import { BalanceDisplay } from '@/components/balance-display';
import { SpendButton } from '@/components/spend-button';
import { TopupButton } from '@/components/topup-button';
import { wallet } from '@/lib/wallet';

// Demo user ID — replace with your auth system
const USER_ID = 'demo-user';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
	const balance = await wallet.getBalance(USER_ID);
	const recentTransactions = await wallet.getTransactions(USER_ID, {
		limit: 5,
	});

	return (
		<main className="mx-auto max-w-md px-4 py-12">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Murai Demo</h1>
					<p className="mt-1 text-sm text-gray-500">Next.js + Midtrans Snap example</p>
				</div>
				<a
					href="https://github.com/user/murai/tree/main/examples/nextjs"
					className="text-xs text-blue-600 hover:underline"
					target="_blank"
					rel="noopener noreferrer"
				>
					View Source
				</a>
			</div>

			<div className="mt-8">
				<BalanceDisplay balance={balance} />
				<p className="mt-2 text-xs text-gray-400">
					1 token = IDR 1 in this demo. Top-ups and spending use the same unit.
				</p>
			</div>

			<div className="mt-6 space-y-3">
				<h2 className="text-sm font-medium text-gray-700">Top Up</h2>
				<p className="text-xs text-gray-400">
					Creates a Midtrans Snap checkout session, then redirects to the payment page.
				</p>
				<div className="grid grid-cols-2 gap-3">
					<TopupButton userId={USER_ID} amount={50_000} label="IDR 50,000" />
					<TopupButton userId={USER_ID} amount={100_000} label="IDR 100,000" />
				</div>
			</div>

			<div className="mt-6 space-y-3">
				<h2 className="text-sm font-medium text-gray-700">Spend</h2>
				<p className="text-xs text-gray-400">
					Deducts from balance atomically. Idempotency key prevents double-charges.
				</p>
				<div className="grid grid-cols-2 gap-3">
					<SpendButton
						userId={USER_ID}
						amount={5_000}
						label="Spend 5,000"
						disabled={balance < 5_000}
					/>
					<SpendButton
						userId={USER_ID}
						amount={10_000}
						label="Spend 10,000"
						disabled={balance < 10_000}
					/>
				</div>
			</div>

			<div className="mt-8">
				<h2 className="text-sm font-medium text-gray-700">Recent Transactions</h2>
				{recentTransactions.length === 0 ? (
					<p className="mt-2 text-sm text-gray-400">No transactions yet</p>
				) : (
					<ul className="mt-2 divide-y divide-gray-100">
						{recentTransactions.map((tx) => (
							<li key={tx.id} className="flex items-center justify-between py-3">
								<div>
									<p className="text-sm font-medium">{tx.amount > 0 ? 'Top-up' : 'Spend'}</p>
									<p className="text-xs text-gray-400">{tx.createdAt.toLocaleString('en-US')}</p>
								</div>
								<p
									className={`font-mono text-sm font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}
								>
									{tx.amount > 0 ? '+' : ''}
									{tx.amount.toLocaleString('en-US')}
								</p>
							</li>
						))}
					</ul>
				)}
			</div>
		</main>
	);
}
