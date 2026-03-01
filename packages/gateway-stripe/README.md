# @murai/gateway-stripe

Stripe Checkout payment gateway adapter for [Murai](https://github.com/ebuntario/murai).

Supports global card payments, Apple Pay, and Google Pay via Stripe Checkout.

## Install

```bash
npm install @murai/gateway-stripe @murai/core stripe
```

## Usage

```typescript
import { createStripeGateway } from '@murai/gateway-stripe';

const gateway = createStripeGateway({
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
});

// Use with createCheckoutManager from @murai/core
```

## Features

- Stripe Checkout Session integration
- Webhook signature verification via Stripe SDK
- Payment status polling
- Supports all Stripe-enabled payment methods

## Documentation

Full docs: [ebuntario.github.io/murai](https://ebuntario.github.io/murai)

## License

[MIT](../../LICENSE)
