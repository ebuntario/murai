import { bench, describe } from 'vitest';
import { createMockStorage } from '../packages/core/src/__tests__/helpers.js';
import { createWallet } from '../packages/core/src/wallet.js';

describe('wallet operations', () => {
	bench('sequential spend', async () => {
		const wallet = createWallet({ storage: createMockStorage() });
		await wallet.topUp('user1', 100_000, 'top-1');
		for (let i = 0; i < 100; i++) {
			await wallet.spend('user1', 10, `spend-${i}`);
		}
	});

	bench('concurrent spend (Promise.all)', async () => {
		const wallet = createWallet({ storage: createMockStorage() });
		await wallet.topUp('user1', 100_000, 'top-1');
		const ops = Array.from({ length: 100 }, (_, i) => wallet.spend('user1', 10, `spend-${i}`));
		await Promise.all(ops);
	});

	bench('topUp + spend cycle', async () => {
		const wallet = createWallet({ storage: createMockStorage() });
		for (let i = 0; i < 100; i++) {
			await wallet.topUp('user1', 100, `top-${i}`);
			await wallet.spend('user1', 50, `spend-${i}`);
		}
	});

	bench('getBalance reads', async () => {
		const wallet = createWallet({ storage: createMockStorage() });
		await wallet.topUp('user1', 10_000, 'top-1');
		for (let i = 0; i < 1000; i++) {
			await wallet.getBalance('user1');
		}
	});
});
