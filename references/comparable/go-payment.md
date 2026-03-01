# go-payment - README Reference

**Source:** github.com/imrenagi/go-payment | **Stars:** Moderate | **License:** Open Source

## Key Patterns to Learn From

- **Indonesian payment gateway focus** — Midtrans SNAP + Xendit, directly relevant to your project
- **Unified API interface** for multiple payment channels — same pattern you're building
- **Exhaustive payment method list** — VA (BCA, BNI, Mandiri, Permata, BRI), eWallets (GoPay, OVO, Dana, LinkAja, ShopeePay), retail (Alfamart), cardless credit (Akulaku), QRIS
- **YAML-based configuration** for payment methods and credentials
- **GORM integration** for database operations
- **Honest limitations section** — "prioritizes ease of use over comprehensive feature coverage"

## Original Content Summary

go-payment is a Go payment processing library acting as a proxy for Midtrans SNAP and Xendit (eWallets and invoicing). Features: multiple payment channels through unified API, seamless gateway switching, configurable admin/installment fees, invoice generation, payment callback storage. Uses GORM for database, YAML for config, environment variables for credentials. Provides REST API endpoints for callbacks and payment processing.

## What Token Wallet Can Copy

- **List every supported payment method explicitly** — Indonesian devs will scan for their preferred method
- YAML or env-based configuration is developer-friendly
- Being honest about limitations builds trust
- This project proves there's demand for Indonesian payment gateway abstractions
- Study the Midtrans SNAP and Xendit integration patterns in the source code
- The gateway-switching pattern is exactly what your adapter interface should enable

## Key Difference From Your Project

go-payment is a payment ROUTING library (routes to the right gateway). Your token-wallet is a BILLING library (manages credits/tokens with payment gateway integration). go-payment doesn't manage balances, transactions, or token economics. That's the gap you fill.
