import Link from 'next/link';

export default function SuccessPage() {
	return (
		<main className="mx-auto max-w-md px-4 py-12 text-center">
			<div className="rounded-xl border border-green-200 bg-green-50 p-8">
				<h1 className="text-2xl font-bold text-green-800">Payment Received</h1>
				<p className="mt-2 text-sm text-green-600">
					Your tokens will be credited once the payment is confirmed via webhook. In sandbox mode,
					trigger the webhook manually from the Midtrans dashboard.
				</p>
			</div>
			<Link
				href="/"
				className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
			>
				Go to Dashboard
			</Link>
		</main>
	);
}
