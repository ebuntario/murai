export function Th({ children }: { children: React.ReactNode }) {
	return (
		<th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
			{children}
		</th>
	);
}
