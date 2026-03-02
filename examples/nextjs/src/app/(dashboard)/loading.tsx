function Skeleton({ className }: { className?: string }) {
	return <div className={`animate-pulse rounded-lg bg-gray-200 ${className ?? ''}`} />;
}

export default function WalletLoading() {
	return (
		<div className="max-w-md">
			{/* Balance */}
			<Skeleton className="h-12 w-48" />
			<Skeleton className="mt-2 h-4 w-72" />

			{/* Top Up section */}
			<div className="mt-6 space-y-3">
				<Skeleton className="h-4 w-16" />
				<Skeleton className="h-4 w-64" />
				<div className="grid grid-cols-2 gap-3">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			</div>

			{/* Expiring Top-Up section */}
			<div className="mt-6 space-y-3">
				<Skeleton className="h-4 w-28" />
				<Skeleton className="h-4 w-64" />
				<div className="grid grid-cols-2 gap-3">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			</div>

			{/* Spend section */}
			<div className="mt-6 space-y-3">
				<Skeleton className="h-4 w-14" />
				<Skeleton className="h-4 w-64" />
				<div className="grid grid-cols-2 gap-3">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			</div>

			{/* Token Management section */}
			<div className="mt-6 space-y-3">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-4 w-64" />
				<Skeleton className="h-12 w-full" />
			</div>

			{/* Recent Transactions */}
			<div className="mt-8 space-y-3">
				<Skeleton className="h-4 w-36" />
				<Skeleton className="h-14 w-full" />
				<Skeleton className="h-14 w-full" />
				<Skeleton className="h-14 w-full" />
			</div>
		</div>
	);
}
