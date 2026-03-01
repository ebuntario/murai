# @murai/gateway-xendit

Xendit Checkout payment gateway adapter for [Murai](https://github.com/ebuntario/murai).

Supports OVO, DANA, ShopeePay, QRIS, and virtual accounts via Xendit Checkout.

## Install

```bash
npm install @murai/gateway-xendit @murai/core
```

## Usage

```typescript
import { createXenditGateway } from '@murai/gateway-xendit';

const gateway = createXenditGateway({
  secretKey: process.env.XENDIT_SECRET_KEY,
  callbackToken: process.env.XENDIT_CALLBACK_TOKEN,
});

// Use with createCheckoutManager from @murai/core
```

## Features

- Xendit Checkout integration
- Timing-safe callback token verification
- Payment status polling via Xendit API
- Invoice-based payment flow

## Documentation

Full docs: [ebuntario.github.io/murai](https://ebuntario.github.io/murai)

## License

[MIT](../../LICENSE)
