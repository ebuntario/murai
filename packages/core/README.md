# @murai-wallet/core

Core wallet, ledger, and checkout manager for [Murai](https://github.com/ebuntario/murai) — a payment-gateway-agnostic token wallet library for AI/SaaS applications.

## Install

```bash
npm install @murai-wallet/core
```

## Usage

```typescript
import { createWallet, createLedger, createCheckoutManager } from '@murai-wallet/core';

// Create wallet with your storage adapter
const wallet = createWallet({ storage });

// Check balance and spend
const balance = await wallet.getBalance('user_123');
if (await wallet.canSpend('user_123', 5_000)) {
  await wallet.spend('user_123', 5_000, 'usage-key');
}

// Top up
await wallet.topUp('user_123', 50_000, 'topup-key');
```

## API

| Function | Returns |
| --- | --- |
| `createWallet({ storage })` | `{ getBalance, canSpend, spend, topUp, expireTokens, getUsageReport, getTransactions, getCheckouts }` |
| `createLedger(storage)` | `{ credit, debit, getBalance, getTransactions }` |
| `createCheckoutManager(gateway, ledger, storage)` | `{ createSession, handleWebhook }` |

## Documentation

Full docs: [ebuntario.github.io/murai](https://ebuntario.github.io/murai)

## License

[MIT](../../LICENSE)
