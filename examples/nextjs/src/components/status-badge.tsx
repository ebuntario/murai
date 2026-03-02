const styles = {
	pending: 'bg-yellow-100 text-yellow-800',
	paid: 'bg-green-100 text-green-800',
	failed: 'bg-red-100 text-red-800',
} as const;

interface StatusBadgeProps {
	status: keyof typeof styles;
}

export function StatusBadge({ status }: StatusBadgeProps) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
		>
			{status}
		</span>
	);
}
