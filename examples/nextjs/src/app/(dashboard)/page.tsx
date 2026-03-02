import { BalanceDisplay } from '@/components/balance-display';
import { ExpireNowButton } from '@/components/expire-now-button';
import { ExpiringTopupButton } from '@/components/expiring-topup-button';
import { SpendButton } from '@/components/spend-button';
import { TopupButton } from '@/components/topup-button';
import { USER_ID } from '@/lib/constants';
import { formatIDR } from '@/lib/format';
import { wallet } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

export default async function WalletPage() {
	const balance = await wallet.getBalance(USER_ID);
	const recentTransactions = await wallet.getTransactions(USER_ID, {
		limit: 5,
	});

	return (
		<div className="max-w-md">
			<BalanceDisplay balance={balance} />
			<p className="mt-2 text-xs text-gray-400">
				1 token = IDR 1 in this demo. Top-ups and spending use the same unit.
			</p>

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
				<h2 className="text-sm font-medium text-gray-700">Expiring Top-Up</h2>
				<p className="text-xs text-gray-400">
					Credits that expire in 5 minutes. Demonstrates FIFO bucket expiry.
				</p>
				<div className="grid grid-cols-2 gap-3">
					<ExpiringTopupButton userId={USER_ID} amount={10_000} label="IDR 10,000" />
					<ExpiringTopupButton userId={USER_ID} amount={25_000} label="IDR 25,000" />
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
						label="IDR 5,000"
						disabled={balance < 5_000}
					/>
					<SpendButton
						userId={USER_ID}
						amount={10_000}
						label="IDR 10,000"
						disabled={balance < 10_000}
					/>
				</div>
			</div>

			<div className="mt-6 space-y-3">
				<h2 className="text-sm font-medium text-gray-700">Token Management</h2>
				<p className="text-xs text-gray-400">
					Expire all credits past their expiry date. Creates debit entries to zero out expired
					buckets.
				</p>
				<ExpireNowButton userId={USER_ID} />
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
									{formatIDR(Math.abs(tx.amount))}
								</p>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
