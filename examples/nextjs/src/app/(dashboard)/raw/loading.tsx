function Skeleton({ className }: { className?: string }) {
	return <div className={`animate-pulse rounded-lg bg-gray-200 ${className ?? ''}`} />;
}

export default function RawDbLoading() {
	return (
		<div>
			<Skeleton className="h-6 w-32" />
			<Skeleton className="mt-2 h-4 w-80" />

			<div className="mt-6 space-y-6">
				{['wallets', 'transactions', 'checkouts'].map((title) => (
					<div key={title}>
						<Skeleton className="h-4 w-32" />
						<Skeleton className="mt-2 h-48 w-full rounded-xl" />
					</div>
				))}
			</div>
		</div>
	);
}
