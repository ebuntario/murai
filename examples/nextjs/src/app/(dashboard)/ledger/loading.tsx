function Skeleton({ className }: { className?: string }) {
	return <div className={`animate-pulse rounded-lg bg-gray-200 ${className ?? ''}`} />;
}

export default function LedgerLoading() {
	return (
		<div>
			<Skeleton className="h-6 w-20" />
			<Skeleton className="mt-2 h-4 w-80" />

			{/* Filter tabs */}
			<div className="mt-4 flex gap-4">
				<Skeleton className="h-4 w-8" />
				<Skeleton className="h-4 w-14" />
				<Skeleton className="h-4 w-12" />
			</div>

			<div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
				{/* Table header */}
				<div className="flex gap-4 border-b border-gray-100 bg-gray-50 px-4 py-3">
					<Skeleton className="h-4 w-12" />
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-16" />
				</div>
				{/* Table rows */}
				{['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'].map((key) => (
					<div key={key} className="flex gap-4 border-b border-gray-100 px-4 py-4">
						<Skeleton className="h-5 w-12 rounded-full" />
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-16" />
					</div>
				))}
			</div>
		</div>
	);
}
