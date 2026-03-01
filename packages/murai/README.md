# murai

Lightweight token wallet library for AI/SaaS apps — with Midtrans, Xendit & Stripe support.

This is the convenience meta-package that re-exports all [Murai](https://github.com/ebuntario/murai) modules in a single install.

## Install

```bash
npm install murai drizzle-orm postgres
```

## Usage

```typescript
import {
  createWallet,
  createCheckoutManager,
  createLedger,
  createDrizzleStorage,
  createMidtransGateway,
} from 'murai';

const storage = createDrizzleStorage(drizzle(sql));
const gateway = createMidtransGateway({ serverKey, clientKey, sandbox: true });
const wallet = createWallet({ storage });
const ledger = createLedger(storage);
const checkout = createCheckoutManager(gateway, ledger, storage);

// Top up via payment gateway
const session = await checkout.createSession({
  userId: 'user_123',
  amount: 100_000,
  successRedirectUrl: 'https://yourapp.com/success',
  failureRedirectUrl: 'https://yourapp.com/fail',
});

// Spend tokens
await wallet.spend('user_123', 5_000, 'usage-key');
```

## Included Packages

| Package | Description |
| --- | --- |
| `@murai/core` | Wallet, ledger, checkout manager, types, errors |
| `@murai/gateway-midtrans` | Midtrans Snap adapter |
| `@murai/gateway-xendit` | Xendit Checkout adapter |
| `@murai/gateway-stripe` | Stripe Checkout adapter |
| `@murai/storage-drizzle` | Drizzle ORM storage (PostgreSQL) |

## Documentation

Full docs: [ebuntario.github.io/murai](https://ebuntario.github.io/murai)

## License

[MIT](../../LICENSE)
