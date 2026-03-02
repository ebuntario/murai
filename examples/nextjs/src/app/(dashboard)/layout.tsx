import { DashboardNav } from '@/components/dashboard-nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<main className="mx-auto max-w-4xl px-4 py-12">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Murai Demo</h1>
					<p className="mt-1 text-sm text-gray-500">Next.js + Midtrans Snap example</p>
				</div>
				<a
					href="https://github.com/ebuntario/murai/tree/main/examples/nextjs"
					className="text-xs text-blue-600 hover:underline"
					target="_blank"
					rel="noopener noreferrer"
				>
					View Source
				</a>
			</div>

			<div className="mt-6">
				<DashboardNav />
			</div>

			<div className="mt-8">{children}</div>
		</main>
	);
}
