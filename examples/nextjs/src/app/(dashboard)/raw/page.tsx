import { sql } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

export default async function RawDbPage() {
	const [wallets, transactions, checkouts] = await Promise.all([
		sql`SELECT * FROM wallets ORDER BY user_id`,
		sql`SELECT * FROM transactions ORDER BY created_at DESC LIMIT 100`,
		sql`SELECT * FROM checkouts ORDER BY created_at DESC LIMIT 50`,
	]);

	const sections = [
		{ title: 'wallets', rows: wallets },
		{ title: 'transactions', rows: transactions },
		{ title: 'checkouts', rows: checkouts },
	] as const;

	return (
		<div>
			<h2 className="text-lg font-semibold">Raw Database</h2>
			<p className="mt-1 text-sm text-gray-500">
				This view queries the database directly — not through the Murai API.
			</p>

			<div className="mt-6 space-y-6">
				{sections.map((section) => (
					<div key={section.title}>
						<h3 className="text-sm font-medium text-gray-700">
							{section.title}{' '}
							<span className="font-normal text-gray-400">({section.rows.length} rows)</span>
						</h3>
						<pre className="mt-2 max-h-96 overflow-auto rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-700 shadow-sm">
							{JSON.stringify(section.rows, null, 2)}
						</pre>
					</div>
				))}
			</div>
		</div>
	);
}
