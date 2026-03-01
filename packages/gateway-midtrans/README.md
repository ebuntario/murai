# @murai/gateway-midtrans

Midtrans Snap payment gateway adapter for [Murai](https://github.com/ebuntario/murai).

Supports GoPay, ShopeePay, QRIS, bank transfer, and credit card via Midtrans Snap.

## Install

```bash
npm install @murai/gateway-midtrans @murai/core
```

## Usage

```typescript
import { createMidtransGateway } from '@murai/gateway-midtrans';

const gateway = createMidtransGateway({
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
  sandbox: true,
});

// Use with createCheckoutManager from @murai/core
```

## Features

- Midtrans Snap checkout integration
- SHA512 timing-safe webhook signature verification
- Payment status polling via Midtrans API
- Sandbox and production support

## Documentation

Full docs: [ebuntario.github.io/murai](https://ebuntario.github.io/murai)

## License

[MIT](../../LICENSE)
