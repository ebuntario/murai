import Link from 'next/link';

export default function SuccessPage() {
	return (
		<main className="mx-auto max-w-md px-4 py-12 text-center">
			<div className="rounded-xl border border-green-200 bg-green-50 p-8">
				<h1 className="text-2xl font-bold text-green-800">Payment Submitted</h1>
				<p className="mt-2 text-sm text-green-600">
					Your tokens will be credited once the payment is confirmed via webhook. In sandbox mode,
					trigger the webhook manually from the Midtrans dashboard.
				</p>
			</div>
			<div className="mt-6 flex items-center justify-center gap-3">
				<Link
					href="/"
					className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
				>
					Go to Dashboard
				</Link>
				<Link
					href="/checkouts"
					className="inline-block rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					View Checkouts
				</Link>
			</div>
		</main>
	);
}
