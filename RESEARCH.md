# Token Wallet: Open Source Research & Strategy

- [Token Wallet: Open Source Research \& Strategy](#token-wallet-open-source-research--strategy)
  - [1. Does This Already Exist?](#1-does-this-already-exist)
    - [The Big Players (Full Billing Platforms)](#the-big-players-full-billing-platforms)
    - [Libraries (Closer to Your Idea)](#libraries-closer-to-your-idea)
    - [Indonesian-Specific](#indonesian-specific)
    - [The Gap You'd Fill](#the-gap-youd-fill)
  - [2. The Harsh Truth](#2-the-harsh-truth)
    - [Why You Should Do This](#why-you-should-do-this)
    - [Why You Might Not Want To Do This](#why-you-might-not-want-to-do-this)
    - [The Verdict](#the-verdict)
  - [3. High-Level Technical Design](#3-high-level-technical-design)
    - [Core Philosophy](#core-philosophy)
    - [Architecture Overview](#architecture-overview)
    - [The Three Core Modules](#the-three-core-modules)
    - [Data Model](#data-model)
    - [Technology Choice: TypeScript (Node.js)](#technology-choice-typescript-nodejs)
    - [Package Structure (Monorepo)](#package-structure-monorepo)
    - [Webhook Security (Critical)](#webhook-security-critical)
    - [Idempotency (Also Critical)](#idempotency-also-critical)
    - [Race Conditions](#race-conditions)
    - [What to Build First (Roadmap)](#what-to-build-first-roadmap)
  - [4. Open Source Project Playbook (For First-Timers)](#4-open-source-project-playbook-for-first-timers)
    - [License](#license)
    - [Repository Essentials Checklist](#repository-essentials-checklist)
    - [How to Get Your First Stars and Contributors](#how-to-get-your-first-stars-and-contributors)
    - [Common Mistakes to Avoid](#common-mistakes-to-avoid)
  - [5. Indonesian Payment Gateway Quick Reference](#5-indonesian-payment-gateway-quick-reference)
    - [Midtrans Snap](#midtrans-snap)
    - [Xendit Checkout](#xendit-checkout)
    - [DOKU (3rd Option)](#doku-3rd-option)
    - [What Indonesians Actually Use to Pay](#what-indonesians-actually-use-to-pay)
  - [6. Naming \& Branding Ideas](#6-naming--branding-ideas)
  - [7. Working With Any AI Model (Including Aggregators)](#7-working-with-any-ai-model-including-aggregators)
    - [The Problem](#the-problem)
    - [Design: Tokens Are Abstract Units](#design-tokens-are-abstract-units)
    - [What Your Library SHOULD Provide (Optional Helper)](#what-your-library-should-provide-optional-helper)
    - [Aggregation Platforms (OpenRouter, LiteLLM, etc.)](#aggregation-platforms-openrouter-litellm-etc)
    - [Key Design Principle](#key-design-principle)
  - [8. Margin \& COGS: How Builders Make Money](#8-margin--cogs-how-builders-make-money)
    - [The Business Problem](#the-business-problem)
    - [How Token Wallet Enables This](#how-token-wallet-enables-this)
    - [What Your Library Provides](#what-your-library-provides)
    - [The Margin Dashboard (Future Feature, Not v1)](#the-margin-dashboard-future-feature-not-v1)
    - [Key Takeaway](#key-takeaway)
  - [9. Choosing Between Midtrans and Xendit](#9-choosing-between-midtrans-and-xendit)
    - [How It Works in Your Library](#how-it-works-in-your-library)
    - [Common Practice: How Indonesian Devs Choose](#common-practice-how-indonesian-devs-choose)
    - [Can a Builder Use Both?](#can-a-builder-use-both)
  - [10. Transaction Security Best Practices](#10-transaction-security-best-practices)
    - [Threat Model: What Can Go Wrong](#threat-model-what-can-go-wrong)
    - [Defense Layer 1: Webhook Signature Verification (MANDATORY)](#defense-layer-1-webhook-signature-verification-mandatory)
    - [Defense Layer 2: Server-Side Payment Verification (DOUBLE CHECK)](#defense-layer-2-server-side-payment-verification-double-check)
    - [Defense Layer 3: Idempotency (PREVENT DUPLICATES)](#defense-layer-3-idempotency-prevent-duplicates)
    - [Defense Layer 4: Atomic Balance Operations (PREVENT OVERDRAW)](#defense-layer-4-atomic-balance-operations-prevent-overdraw)
    - [Defense Layer 5: Webhook Endpoint Hardening](#defense-layer-5-webhook-endpoint-hardening)
    - [Security Checklist for Your README](#security-checklist-for-your-readme)
  - [11. To Fork or Not to Fork](#11-to-fork-or-not-to-fork)
    - [Why You Might Fork an Existing Project](#why-you-might-fork-an-existing-project)
    - [Why You Should NOT Fork (Strong Recommendation)](#why-you-should-not-fork-strong-recommendation)
    - [What You SHOULD Do Instead](#what-you-should-do-instead)
    - [The One Exception](#the-one-exception)
  - [12. Accounting, Auditing \& Reconciliation](#12-accounting-auditing--reconciliation)
    - [Why This Matters](#why-this-matters)
    - [Principle 1: Double-Entry Ledger (The Foundation)](#principle-1-double-entry-ledger-the-foundation)
    - [Implementing This in Your Data Model](#implementing-this-in-your-data-model)
    - [Principle 2: Append-Only (Never Modify History)](#principle-2-append-only-never-modify-history)
    - [Principle 3: Reconciliation Support](#principle-3-reconciliation-support)
    - [Principle 4: Audit Trail](#principle-4-audit-trail)
    - [Principle 5: Reporting Hooks](#principle-5-reporting-hooks)
  - [13. Margin Visibility: "Am I Losing Money?"](#13-margin-visibility-am-i-losing-money)
    - [The Core Concept](#the-core-concept)
    - [Margin Report API](#margin-report-api)
    - ["Am I Losing Money?" Alert](#am-i-losing-money-alert)
    - [Implementation Approach](#implementation-approach)
    - [Why This Is a Differentiator](#why-this-is-a-differentiator)
    - [Revenue Attribution (Optional, Future)](#revenue-attribution-optional-future)
  - [14. Subscription Models (Future Roadmap)](#14-subscription-models-future-roadmap)
    - [Model 1: Recurring Credit Top-Up](#model-1-recurring-credit-top-up)
    - [Model 2: Capped Usage (Like Claude Pro)](#model-2-capped-usage-like-claude-pro)
    - [Model 3: Unlimited Usage (Controlled)](#model-3-unlimited-usage-controlled)
    - [How These Fit Into the Architecture](#how-these-fit-into-the-architecture)
    - [Roadmap Priority](#roadmap-priority)
  - [15. Modern Architecture \& Engineering Best Practices](#15-modern-architecture--engineering-best-practices)
    - [Why This Matters for Open Source Adoption](#why-this-matters-for-open-source-adoption)
    - [The Stack (Recommended)](#the-stack-recommended)
    - [Why These Choices](#why-these-choices)
    - [Project Structure (Modern Patterns)](#project-structure-modern-patterns)
    - [Key Engineering Patterns](#key-engineering-patterns)
  - [16. Database Choice: PostgreSQL (Not MySQL)](#16-database-choice-postgresql-not-mysql)
    - [The Recommendation: PostgreSQL](#the-recommendation-postgresql)
    - [Why PostgreSQL](#why-postgresql)
    - [Why Not MySQL](#why-not-mysql)
    - [How to Support Both (Via Drizzle)](#how-to-support-both-via-drizzle)
    - [For the README](#for-the-readme)
  - [17. Currency Handling: Agnostic vs. Configured](#17-currency-handling-agnostic-vs-configured)
    - [The Two Layers of "Currency" in Your System](#the-two-layers-of-currency-in-your-system)
    - [Three Approaches (And Why Only One Is Right)](#three-approaches-and-why-only-one-is-right)
    - [How This Shows Up in the Config](#how-this-shows-up-in-the-config)
    - [For the Checkout Table](#for-the-checkout-table)
    - [For the README](#for-the-readme-1)
    - [Edge Case: What If They Don't Set It?](#edge-case-what-if-they-dont-set-it)
  - [18. Use Cases That Won't Work (And Why That's Okay)](#18-use-cases-that-wont-work-and-why-thats-okay)
    - [1. User-to-User Token Transfers](#1-user-to-user-token-transfers)
    - [2. Refunds Back to Original Payment Method](#2-refunds-back-to-original-payment-method)
    - [3. Team/Organization Shared Wallets](#3-teamorganization-shared-wallets)
    - [4. B2B Net-30 Invoicing (Post-Pay)](#4-b2b-net-30-invoicing-post-pay)
    - [5. Real-Time Streaming Billing](#5-real-time-streaming-billing)
    - [6. Pay-Per-Result (Not Pay-Per-Attempt)](#6-pay-per-result-not-pay-per-attempt)
    - [7. Token Expiration with Legal Compliance](#7-token-expiration-with-legal-compliance)
    - [8. Crypto/Blockchain Token Integration](#8-cryptoblockchain-token-integration)
    - [9. Multi-Product / Multi-Wallet Per User](#9-multi-product--multi-wallet-per-user)
    - [10. Freemium with Daily Free Credits](#10-freemium-with-daily-free-credits)
    - [Summary Table](#summary-table)
    - [Why This Section Matters](#why-this-section-matters)
  - [19. Testing Strategy: TDD Is Non-Negotiable](#19-testing-strategy-tdd-is-non-negotiable)
    - [The Short Answer](#the-short-answer)
    - [TestSprite vs Playwright: Wrong Tools for This Job](#testsprite-vs-playwright-wrong-tools-for-this-job)
    - [Where TestSprite DOES Fit](#where-testsprite-does-fit)
    - [The Right Testing Stack](#the-right-testing-stack)
    - [TDD for Payment Code: What It Looks Like](#tdd-for-payment-code-what-it-looks-like)
    - [Must-Have Test Cases Before v0.1](#must-have-test-cases-before-v01)
    - [Coverage: 90%+ or CI Fails](#coverage-90-or-ci-fails)
    - [Summary: Right Tool, Right Job](#summary-right-tool-right-job)

## 1. Does This Already Exist?

Short answer: **partially, but not exactly what you're building.**

There are billing platforms out there, but none of them nail the specific combo you're describing — a lightweight, plug-and-play token wallet with Indonesian payment gateway support baked in. Here's the landscape:

### The Big Players (Full Billing Platforms)

**Lago** (~12,000 GitHub stars) is the closest thing to a complete solution. It's a Ruby on Rails app backed by Y Combinator with $22M in funding. It handles event-based metering, prepaid credits, and integrates with Stripe and Paddle. Companies like Mistral.ai and Groq use it. But here's the thing — it's a *massive* platform. If you just want "user buys tokens, tokens get deducted on AI usage," Lago is like bringing a tank to a knife fight. And it has zero support for Midtrans or Xendit.

**Flexprice** (~3,500 stars) is newer and specifically built for AI/SaaS billing. It's written in Go, has native credit/wallet support, and is more focused on the token economy use case. Still, no Southeast Asian payment gateway support.

**OpenMeter** (~1,700 stars) is great at metering (tracking how many tokens you used) but lighter on the wallet/credit management side.

**Kill Bill** is the enterprise dinosaur — 10+ years old, written in Java, extremely flexible but extremely complex. Overkill for your use case.

### Libraries (Closer to Your Idea)

**@user-credits** is a Node.js/TypeScript library that's actually quite close to your concept — flexible credit management, technology-agnostic, with Stripe integration. But it's small (~100 stars) and only supports Stripe.

**LiteLLM** (~27,500 stars) is hugely popular but it's an LLM gateway, not a billing system. It tracks token usage across 100+ LLM providers and has budget controls, but doesn't handle payments.

### Indonesian-Specific

**go-payment** is a Go library by an Indonesian developer that connects to both Midtrans and Xendit. It's a payment connector, not a billing system, but it proves there's demand for multi-gateway integration in the Indonesian market.

### The Gap You'd Fill

Nobody has built a **lightweight, payment-gateway-agnostic token wallet** that:

- Manages credit balances (buy, deduct, check balance, transaction history)
- Abstracts payment gateways behind a simple adapter pattern
- Ships with Midtrans Snap and Xendit Checkout out of the box
- Is designed to be dropped into any AI/SaaS product in minutes, not days

This is a real gap. The existing solutions are either too big (Lago, Kill Bill), too Western-focused (everything uses Stripe), or too narrow (just metering, or just payment routing).

---

## 2. The Harsh Truth

### Why You Should Do This

**The market timing is right.** Every AI product needs a token/credit system. ChatGPT has credits. Claude has usage limits. Midjourney has credits. Every AI startup in Southeast Asia building on top of LLMs needs this exact thing. The trend of AI-powered products needing usage-based billing is only accelerating.

**The Indonesian angle is your moat.** Every global billing tool defaults to Stripe. But Stripe's presence in Indonesia is limited compared to Midtrans and Xendit. Indonesian developers building AI products right now are rolling their own token systems from scratch every single time. That's painful and wasteful. You're solving a real problem you've personally experienced — that's the best kind of open source project.

**It's the right size for a first project.** This isn't a massive platform. It's a focused library with clear boundaries. You can ship a useful v0.1 in a few weeks, not months. Small, focused tools are actually what get popular on GitHub — think about how Ruff (a Python linter) or UV (a Python package manager) got tens of thousands of stars by doing one thing really well.

**It builds your brand in a specific niche.** "The person who built the token wallet library" is a much stronger identity than "someone who contributed to a big project." Owning a project positions you as an expert, which is exactly what you want for popularity.

### Why You Might Not Want To Do This

**Maintenance is a long-term commitment.** Open source isn't "build and forget." People will file issues at 2am. Payment gateway APIs change. Security vulnerabilities need patching. If you abandon this after 3 months, it hurts your reputation more than never starting. Be honest with yourself: can you commit to at least 6-12 months of active maintenance?

**Billing/payment code carries real responsibility.** If there's a bug in your token deduction logic and someone gets overcharged, that's real money. If there's a security hole in your webhook verification and someone fakes a payment confirmation, that's fraud. Payment code needs to be rock-solid, well-tested, and audited. This isn't a to-do app.

**The big players might add this feature.** Lago or Flexprice could add Midtrans/Xendit support tomorrow. If they do, your project's value proposition shrinks significantly. Your advantage is speed and focus — you need to build community before that happens.

**Popularity isn't guaranteed.** Most open source projects get zero stars. Building something useful is necessary but not sufficient. You also need to market it consistently — write blog posts, share on Twitter/X, post on HackerNews, engage in Indonesian developer communities. If you're not willing to do the promotion work, the code alone won't make you popular.

**You're competing against "just build it yourself."** Many developers will look at a token wallet and think "I can build this in a weekend." Your project needs to be so well-designed, well-documented, and well-tested that using it is clearly better than rolling your own. That bar is higher than most people expect.

### The Verdict

**Do it, but go in with clear expectations.** The opportunity is real, the timing is good, and the scope is manageable. But treat it like a product launch, not just a code dump. Plan for at least 6 months of active development. Budget time for documentation and community building, not just code. And be prepared for the possibility that it takes 6-12 months before it gets meaningful traction.

---

## 3. High-Level Technical Design

### Core Philosophy

The project should follow one principle: **make the simplest possible thing that works, then let people extend it.**

A developer should be able to go from zero to "users can buy and spend tokens" in under 30 minutes. That's the benchmark.

### Architecture Overview

```text
┌─────────────────────────────────────────────────┐
│                 Your AI Application              │
│                                                  │
│   "User sends a prompt → deduct 10 tokens"      │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Token Wallet SDK                    │
│                                                  │
│  ┌─────────────┐  ┌──────────┐  ┌────────────┐ │
│  │   Wallet     │  │  Ledger  │  │  Checkout   │ │
│  │   Manager    │  │  (Tx     │  │  Manager    │ │
│  │             │  │   Log)   │  │             │ │
│  │ - balance() │  │ - debit  │  │ - topUp()   │ │
│  │ - canSpend()│  │ - credit │  │ - webhook() │ │
│  │ - spend()   │  │ - query  │  │ - verify()  │ │
│  └─────────────┘  └──────────┘  └──────┬──────┘ │
│                                         │        │
│  ┌──────────────────────────────────────┘        │
│  │     Payment Gateway Adapter Interface         │
│  └──────┬──────────────┬──────────────┬──────── │
│         │              │              │          │
│  ┌──────▼───┐  ┌───────▼────┐  ┌─────▼──────┐  │
│  │ Midtrans │  │   Xendit   │  │   Stripe   │  │
│  │  Snap    │  │  Checkout  │  │  Checkout  │  │
│  │ Adapter  │  │  Adapter   │  │  Adapter   │  │
│  └──────────┘  └────────────┘  └────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │         Storage Adapter Interface         │   │
│  └──────┬──────────────┬───────────────┬────┘   │
│         │              │               │         │
│  ┌──────▼───┐  ┌───────▼────┐  ┌──────▼─────┐  │
│  │ Postgres │  │   MySQL    │  │   SQLite   │  │
│  │ Adapter  │  │  Adapter   │  │  Adapter   │  │
│  └──────────┘  └────────────┘  └────────────┘  │
└─────────────────────────────────────────────────┘
```

### The Three Core Modules

**1. Wallet Manager** — The main thing developers interact with.

```typescript
// This is what a developer's code looks like:
import { TokenWallet } from 'token-wallet';

const wallet = new TokenWallet({
  gateway: 'midtrans',        // or 'xendit', 'stripe'
  gatewayConfig: {
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
    isProduction: false,
  },
  storage: 'postgres',        // or 'mysql', 'sqlite', 'custom'
  storageConfig: {
    connectionString: process.env.DATABASE_URL,
  },
});

// Check balance
const balance = await wallet.getBalance(userId);

// Can this user afford this action?
const canAfford = await wallet.canSpend(userId, 50);

// Deduct tokens after AI usage
await wallet.spend(userId, 50, { reason: 'gpt-4-prompt', metadata: { promptId: '...' } });

// Create a top-up checkout session
const checkout = await wallet.topUp(userId, {
  amount: 100,                // 100 tokens
  price: 50000,               // Rp 50,000
  currency: 'IDR',
});
// checkout.redirectUrl → send user here to pay

// Handle webhook (in your API route)
app.post('/webhook/payment', async (req, res) => {
  const result = await wallet.handleWebhook(req.body, req.headers);
  // Tokens automatically credited to user's wallet
  res.status(200).send('OK');
});
```

That's it. That's the whole developer experience. Everything else is internal.

**2. Ledger** — An append-only transaction log.

Every token movement is recorded: credits (from purchases), debits (from usage), expirations, refunds, adjustments. This is critical for billing disputes, auditing, and debugging. Think of it like a bank statement for tokens.

Key design decisions:

- Append-only (never delete or modify transactions)
- Double-entry style (every spend is a debit, every top-up is a credit)
- Idempotent operations (retrying the same webhook doesn't double-credit)
- Supports pagination and filtering for transaction history

**3. Checkout Manager** — The payment gateway abstraction.

This is where the adapter pattern lives. Each payment gateway implements a simple interface:

```typescript
interface PaymentGatewayAdapter {
  // Create a checkout session and return a URL
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;

  // Verify and parse an incoming webhook
  verifyWebhook(payload: any, headers: any): Promise<WebhookResult>;

  // Check payment status (fallback if webhook is delayed)
  getPaymentStatus(transactionId: string): Promise<PaymentStatus>;
}
```

For Midtrans Snap, `createCheckout` calls the Snap API and returns the redirect URL. For Xendit, it creates a Payment Link. The application code never knows which gateway is being used.

### Data Model

```text
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│    wallets    │     │   transactions    │     │    checkouts     │
├──────────────┤     ├───────────────────┤     ├──────────────────┤
│ id           │     │ id                │     │ id               │
│ user_id      │◄────│ wallet_id         │     │ wallet_id        │
│ balance      │     │ type (credit/     │     │ gateway          │
│ created_at   │     │       debit)      │     │ gateway_ref      │
│ updated_at   │     │ amount            │     │ amount_tokens    │
└──────────────┘     │ running_balance   │     │ amount_price     │
                     │ reference_type    │     │ currency         │
                     │ reference_id      │     │ status           │
                     │ reason            │     │ redirect_url     │
                     │ metadata (JSON)   │     │ webhook_verified │
                     │ idempotency_key   │     │ created_at       │
                     │ created_at        │     │ completed_at     │
                     └───────────────────┘     └──────────────────┘
```

### Technology Choice: TypeScript (Node.js)

Why TypeScript:

- Most AI/SaaS apps are built with Node.js or Next.js, especially in the startup world
- TypeScript gives you type safety which is critical for financial operations
- Largest ecosystem for payment gateway client libraries
- Easy to publish as an npm package
- Indonesia's developer community heavily uses JavaScript/TypeScript

### Package Structure (Monorepo)

```text
token-wallet/
├── packages/
│   ├── core/                    # Main SDK - wallet, ledger, types
│   │   ├── src/
│   │   │   ├── wallet.ts        # WalletManager class
│   │   │   ├── ledger.ts        # Transaction ledger
│   │   │   ├── checkout.ts      # Checkout manager
│   │   │   ├── types.ts         # All TypeScript interfaces
│   │   │   └── index.ts         # Public API exports
│   │   ├── package.json         # @token-wallet/core
│   │   └── tsconfig.json
│   │
│   ├── gateway-midtrans/        # Midtrans Snap adapter
│   │   ├── src/
│   │   │   └── adapter.ts       # MidtransAdapter implements PaymentGatewayAdapter
│   │   └── package.json         # @token-wallet/gateway-midtrans
│   │
│   ├── gateway-xendit/          # Xendit Checkout adapter
│   │   ├── src/
│   │   │   └── adapter.ts       # XenditAdapter implements PaymentGatewayAdapter
│   │   └── package.json         # @token-wallet/gateway-xendit
│   │
│   ├── gateway-stripe/          # Stripe Checkout adapter (for global reach)
│   │   └── ...
│   │
│   ├── storage-postgres/        # PostgreSQL storage adapter
│   │   └── package.json         # @token-wallet/storage-postgres
│   │
│   ├── storage-mysql/           # MySQL storage adapter
│   │   └── package.json         # @token-wallet/storage-mysql
│   │
│   └── token-wallet/            # Convenience meta-package (re-exports core + all adapters)
│       └── package.json         # token-wallet (the "just works" package)
│
├── examples/
│   ├── nextjs-example/          # Full Next.js example app
│   ├── express-example/         # Express.js example
│   └── hono-example/            # Hono (lightweight) example
│
├── docs/                        # Documentation site (Docusaurus or similar)
│
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   ├── pull_request_template.md
│   └── workflows/
│       ├── ci.yml               # Lint, test, build on every PR
│       ├── release.yml          # Publish to npm on tag
│       └── security.yml         # Dependency audit
│
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── CHANGELOG.md
├── SECURITY.md
├── LICENSE                      # MIT recommended
├── turbo.json                   # Turborepo config
└── package.json                 # Root workspace config
```

Why monorepo: Adapters share types and interfaces from core. Changes to the core interface immediately get type-checked against all adapters. But each adapter is a separate npm package, so users only install what they need.

### Webhook Security (Critical)

Each gateway verifies webhooks differently. Your adapters must handle this correctly:

- **Midtrans**: SHA512 signature verification → `SHA512(order_id + status_code + gross_amount + ServerKey)`
- **Xendit**: `x-callback-token` header verification against your configured token
- **Stripe**: HMAC signature verification using webhook signing secret

The `verifyWebhook` method in each adapter handles this. If verification fails, the webhook is rejected and no tokens are credited. This prevents fake payment confirmations.

### Idempotency (Also Critical)

Webhooks can arrive multiple times (Xendit retries up to 6 times). Your system must handle this gracefully:

1. Every checkout gets a unique `idempotency_key`
2. Before crediting tokens, check if a transaction with that key already exists
3. If it does, return success without creating a duplicate credit
4. This is handled at the ledger level, not the adapter level

### Race Conditions

Two concurrent `spend()` calls for the same user could overdraw the balance. Solutions:

- Use database-level locking (SELECT FOR UPDATE on the wallet row)
- Or use optimistic concurrency (version column, retry on conflict)
- The storage adapter is responsible for this, not the core SDK

### What to Build First (Roadmap)

#### v0.1.0 — Minimum Viable Library (Week 1-3)

- Core wallet: `getBalance()`, `spend()`, `topUp()`, `handleWebhook()`
- Ledger: basic append-only transaction log
- One gateway adapter: Midtrans Snap
- One storage adapter: PostgreSQL
- Basic test suite
- README with quickstart example

#### v0.2.0 — Second Gateway (Week 4-5)

- Xendit Checkout adapter
- Transaction history query API
- Idempotency handling
- Webhook retry handling

#### v0.3.0 — Developer Experience (Week 6-8)

- `token-wallet` convenience package
- Next.js example app (full working demo)
- Express.js example
- Documentation site
- MySQL storage adapter

#### v0.4.0 — Production Features (Week 9-12)

- Token expiration support
- Rate limiting
- Admin dashboard (optional)
- Stripe adapter (for global reach)
- SQLite adapter (for prototyping)

#### v1.0.0 — Stable Release

- Full test coverage
- Security audit
- Performance benchmarks
- Migration guides
- Multiple real-world examples

---

## 4. Open Source Project Playbook (For First-Timers)

### License

Use **MIT**. It's the simplest, most widely adopted, and most welcoming for a developer library. Developers see MIT and immediately know they can use it anywhere without legal headaches. Apache 2.0 is the other good option (better patent protection), but MIT's simplicity wins for community adoption.

### Repository Essentials Checklist

Before you make the repo public, have these ready:

- **README.md** — The most important file. Include: what it is (one sentence), why it exists, installation, 5-minute quickstart with code example, link to docs, badge for build status, and a "Contributing" section.
- **CONTRIBUTING.md** — How to set up the dev environment, how to run tests, PR process, code style rules.
- **CODE_OF_CONDUCT.md** — Use the Contributor Covenant (standard template). Signals professionalism.
- **LICENSE** — MIT license file.
- **CHANGELOG.md** — Start from day one. Every release gets an entry.
- **SECURITY.md** — How to report vulnerabilities (especially important for payment-related code).
- **Issue templates** — Bug report and feature request templates in `.github/ISSUE_TEMPLATE/`.
- **PR template** — Checklist in `.github/pull_request_template.md`.
- **CI/CD** — GitHub Actions that run lint + tests on every PR. Automate npm publishing on version tags.

### How to Get Your First Stars and Contributors

#### Week 1: Launch

- Post on Twitter/X with a demo GIF showing the 5-minute setup
- Post on r/webdev, r/node, r/indonesia (if relevant)
- Write a DEV.to article: "I built an open source token wallet for AI apps"
- Share in Indonesian developer communities (Telegram groups, Discord servers)

#### Month 1: Content

- Write "Why every AI app needs a token billing system" blog post
- Create a YouTube tutorial showing integration with a Next.js app
- Post comparisons: "Token Wallet vs building your own credit system"

#### Month 2-3: Community

- Label easy issues as "good first issue"
- Respond to every issue and PR within 24 hours
- Thank every contributor publicly
- Write a "How we handle webhook verification" technical deep-dive

#### Ongoing: Build in Public

- Share your GitHub stats and milestones on social media
- Talk about design decisions and trade-offs
- Be active in related communities (not just promoting your project, but helping people)

### Common Mistakes to Avoid

1. **Don't add every feature people ask for.** Stay focused on being the best token wallet, not a full billing platform.
2. **Don't skip tests.** Payment code with bugs costs people real money. Aim for high test coverage from day one.
3. **Don't ghost issues.** Even a "thanks for reporting, I'll look into this next week" is better than silence.
4. **Don't overengineer v0.1.** Ship something useful fast, then iterate. Perfect is the enemy of shipped.
5. **Don't forget documentation.** The #1 complaint about open source projects is poor docs.

---

## 5. Indonesian Payment Gateway Quick Reference

### Midtrans Snap

- **What it does**: Hosted checkout page (popup or redirect) supporting 25+ Indonesian payment methods
- **Integration**: Call Snap API with Server Key → get Snap token → load payment page → receive webhook
- **Key methods supported**: GoPay, OVO, Dana, ShopeePay, QRIS, bank transfer, virtual accounts, credit cards
- **Webhook verification**: SHA512 signature = `SHA512(order_id + status_code + gross_amount + ServerKey)`
- **Pricing**: ~Rp 1,500 per transaction, no monthly fees
- **SDK**: Official libraries for PHP, Node.js, Python

### Xendit Checkout

- **What it does**: Payment Link / hosted checkout with redirect flow
- **Integration**: Create Payment Link via API → get `invoice_url` → redirect user → receive webhook
- **Key methods supported**: Virtual accounts, e-wallets, retail outlets, credit cards, QRIS
- **Webhook verification**: `x-callback-token` header verification
- **Pricing**: Transaction-based, no monthly fees, T+0 settlement available
- **Retry**: Automatic webhook retry up to 6 times with exponential backoff

### DOKU (3rd Option)

- **What it does**: Jokul Checkout hosted payment page
- **Strength**: Oldest payment gateway in Indonesia (est. 2007), strong enterprise presence
- **Webhook verification**: Shared Key Hash mechanism
- **Best for**: Enterprise clients needing long-term stability

### What Indonesians Actually Use to Pay

E-wallets dominate: GoPay (88% usage), Dana (83%), OVO, ShopeePay. QRIS is the fastest-growing method with 56.3 million users and 175% YoY growth. Bank transfers are second for e-commerce. Credit cards are relatively uncommon (~13% of transactions). Indonesia is NOT a card-first market — your gateway integration should prioritize e-wallets, QRIS, and bank transfers.

---

## 6. Naming & Branding Ideas

A few suggestions for the project name (check npm and GitHub availability):

- **token-wallet** — Simple, descriptive, easy to search for
- **tokenvault** — Implies security and storage
- **creditkit** — Short, memorable, developer-friendly
- **paytokens** — Action-oriented
- **wallet-sdk** — Generic but clear

Pick something short, easy to type in a terminal (`npm install ___`), and Googleable.

---

## 7. Working With Any AI Model (Including Aggregators)

### The Problem

Your library deducts "tokens" from a user's wallet. But 1 token in your system doesn't equal 1 token in OpenAI's API. Different models have wildly different costs. GPT-4o costs ~$2.50/million input tokens, Claude Sonnet costs ~$3/million, a local Llama model might be free but costs GPU time, and aggregation platforms like OpenRouter or LiteLLM route to whichever model they choose.

The token wallet should NOT care about any of this. That's the builder's problem. Your library just manages a balance.

### Design: Tokens Are Abstract Units

Think of tokens in your wallet like arcade credits. The arcade decides that 1 credit = 1 game of Pac-Man but 3 credits = 1 game of the racing simulator. Similarly, the builder decides that 1 wallet token = 1 prompt to GPT-3.5 but 5 wallet tokens = 1 prompt to GPT-4.

Your library provides the `spend()` function. The builder decides how many tokens to pass into it.

```typescript
// The builder's code — NOT part of your library
function calculateTokenCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = {
    'gpt-4o': { input: 0.05, output: 0.15 },
    'claude-sonnet': { input: 0.06, output: 0.18 },
    'llama-3-local': { input: 0.001, output: 0.001 },
  };
  const rate = rates[model];
  return Math.ceil(inputTokens * rate.input + outputTokens * rate.output);
}

// After AI call completes
const cost = calculateTokenCost('gpt-4o', usage.inputTokens, usage.outputTokens);
await wallet.spend(userId, cost, {
  reason: 'ai-completion',
  metadata: { model: 'gpt-4o', inputTokens: 350, outputTokens: 120 }
});
```

### What Your Library SHOULD Provide (Optional Helper)

You don't need to build a pricing engine, but you can provide a lightweight helper that builders can optionally use:

```typescript
// Optional: @token-wallet/pricing-helper (separate package)
import { PricingTable } from '@token-wallet/pricing-helper';

const pricing = new PricingTable({
  'gpt-4o':        { inputPer1k: 5, outputPer1k: 15 },
  'claude-sonnet': { inputPer1k: 6, outputPer1k: 18 },
  'local-llama':   { inputPer1k: 1, outputPer1k: 1 },
});

const cost = pricing.calculate('gpt-4o', { input: 350, output: 120 });
// Returns: 4 tokens (rounded up)
```

This is optional. Builders who use OpenRouter or their own routing don't need it. But for builders who just want a quick setup, it saves them from writing boilerplate.

### Aggregation Platforms (OpenRouter, LiteLLM, etc.)

When using aggregation platforms, the builder typically gets the actual model used and the token count in the API response. They just pass that into the pricing table. Your wallet doesn't need to know about the aggregator at all.

```typescript
// OpenRouter returns which model actually ran + token counts
const response = await openrouter.chat.completions.create({ ... });
const actualModel = response.model;          // e.g., "meta-llama/llama-3-70b"
const usage = response.usage;                // { prompt_tokens: 200, completion_tokens: 50 }

const cost = pricing.calculate(actualModel, {
  input: usage.prompt_tokens,
  output: usage.completion_tokens
});
await wallet.spend(userId, cost, { reason: 'chat', metadata: { model: actualModel } });
```

### Key Design Principle

**Your library is the bank. The builder is the merchant.** The bank doesn't decide how much a coffee costs — the merchant does. Your library manages balances and transactions. The builder decides how to price their AI features.

---

## 8. Margin & COGS: How Builders Make Money

### The Business Problem

A builder's AI app has a cost: they pay OpenAI/Anthropic/etc. per API token used. They sell "tokens" to users at a higher price. The difference is their margin. But this is tricky because AI costs change, models have different prices, and builders need flexibility.

### How Token Wallet Enables This

The key insight is that "wallet tokens" are NOT the same as "AI provider tokens." They're an abstract currency the builder defines. The builder sets two things: how much a user pays for wallet tokens (the sell price), and how many wallet tokens an AI operation costs (the spend rate, which factors in COGS).

Here's a concrete example:

```text
Builder's COGS:
  - GPT-4o costs builder $2.50 per 1M input tokens from OpenAI
  - That's $0.0000025 per input token

Builder's pricing:
  - Sell 1,000 wallet tokens for Rp 15,000 (~$0.90)
  - 1 wallet token = approximately Rp 15

Builder's margin math:
  - A typical GPT-4o prompt uses ~500 input + 200 output tokens
  - Builder's COGS: ~$0.002 per prompt ≈ Rp 32
  - Builder charges: 5 wallet tokens = Rp 75
  - Gross margin: ~57%
```

### What Your Library Provides

Your library handles the "sell" and "spend" sides. The builder configures the pricing through your `topUp()` and `spend()` calls:

```typescript
// SELL SIDE: Builder defines token packages
// (this is configuration, not library code)
const TOKEN_PACKAGES = [
  { id: 'starter',  tokens: 500,   price: 10000,  currency: 'IDR' },  // Rp 10K
  { id: 'standard', tokens: 2500,  price: 45000,  currency: 'IDR' },  // Rp 45K (10% bonus)
  { id: 'pro',      tokens: 10000, price: 150000, currency: 'IDR' },  // Rp 150K (25% bonus)
];

// When user buys a package
const pkg = TOKEN_PACKAGES.find(p => p.id === selectedPackage);
const checkout = await wallet.topUp(userId, {
  amount: pkg.tokens,
  price: pkg.price,
  currency: pkg.currency,
  metadata: { packageId: pkg.id }
});

// SPEND SIDE: Builder defines costs per operation
// (builder calculates this based on their COGS + desired margin)
const OPERATION_COSTS = {
  'chat-gpt4o':     5,    // costs builder ~Rp 32, charges Rp 75 → 57% margin
  'chat-gpt3.5':    1,    // costs builder ~Rp 3, charges Rp 15 → 80% margin
  'image-gen':      20,   // costs builder ~Rp 150, charges Rp 300 → 50% margin
  'document-parse': 3,    // costs builder ~Rp 20, charges Rp 45 → 55% margin
};

await wallet.spend(userId, OPERATION_COSTS['chat-gpt4o'], {
  reason: 'chat-gpt4o',
  metadata: { model: 'gpt-4o', actualCostUSD: 0.002 }
});
```

### The Margin Dashboard (Future Feature, Not v1)

A useful future feature would be a simple margin calculator where the builder can see their actual COGS vs. revenue per operation. But for v1, just storing the `metadata` with `actualCostUSD` gives builders the raw data to calculate this themselves.

### Key Takeaway

Your library doesn't need a "margin" feature. The margin lives in the gap between what the builder charges (token package prices) and what the builder spends (wallet tokens per operation). By making both sides configurable, the builder has full control. Document this pattern clearly in your docs with a "Pricing Strategy Guide" that walks through the math.

---

## 9. Choosing Between Midtrans and Xendit

### How It Works in Your Library

The builder picks one gateway at initialization time. It's a one-line config change:

```typescript
// Option A: Midtrans
const wallet = new TokenWallet({
  gateway: 'midtrans',
  gatewayConfig: {
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
    isProduction: false,
  },
  // ...
});

// Option B: Xendit
const wallet = new TokenWallet({
  gateway: 'xendit',
  gatewayConfig: {
    secretKey: process.env.XENDIT_SECRET_KEY,
    callbackToken: process.env.XENDIT_CALLBACK_TOKEN,
  },
  // ...
});
```

That's the only thing that changes. The rest of the code (`wallet.spend()`, `wallet.topUp()`, `wallet.handleWebhook()`) works identically regardless of which gateway is active.

### Common Practice: How Indonesian Devs Choose

Most Indonesian startups pick **one** gateway and stick with it. Running two simultaneously adds complexity with almost no benefit (both support the same payment methods). Here's the decision framework you should include in your docs:

**Choose Midtrans if:**

- You want the widest payment method coverage out of the box (25+ methods)
- You prefer Snap's popup-based checkout (stays on your site)
- You're already in the Gojek/GoTo ecosystem
- You want a battle-tested option (oldest major gateway after DOKU)

**Choose Xendit if:**

- You want faster settlement (T+0 available, Midtrans is typically T+1 or T+2)
- You prefer a redirect-based checkout flow
- You need better API documentation (Xendit's docs are widely considered cleaner)
- You want easier disbursement features later (paying out to users)
- You plan to expand to Philippines or other SEA markets

**For your library's defaults:** Ship Midtrans as the first adapter since it has the largest market share in Indonesia. Add Xendit second. In your docs, include a simple comparison table so builders can decide in 30 seconds.

### Can a Builder Use Both?

Technically yes, but don't encourage it for v1. If someone really needs failover (gateway A is down, fall back to gateway B), that's a v2 feature. For now, one gateway per deployment keeps things simple and reduces the surface area for bugs.

---

## 10. Transaction Security Best Practices

Your library doesn't process payments directly — Midtrans and Xendit handle the actual money movement. But you ARE responsible for making sure tokens are only credited when a real payment happened, and debited correctly. Here's how to lock it down.

### Threat Model: What Can Go Wrong

1. **Fake webhook** — Attacker sends a POST to your webhook endpoint pretending to be Midtrans, claiming a payment was made. If you don't verify, you credit free tokens.
2. **Replay attack** — Attacker captures a legitimate webhook and sends it again. Without idempotency, the user gets double tokens.
3. **Amount mismatch** — Attacker starts a checkout for 10,000 tokens (Rp 150,000), then somehow the payment amount changes. You credit 10,000 tokens but only Rp 10,000 was paid.
4. **Race condition on spend** — Two concurrent API calls both check balance (100 tokens), both see "enough," both deduct 80 tokens. User ends up at -60.
5. **Webhook endpoint exposure** — Attacker discovers your webhook URL and brute-forces it with crafted payloads.

### Defense Layer 1: Webhook Signature Verification (MANDATORY)

Every single webhook must be cryptographically verified before any token credit happens. This is non-negotiable.

```typescript
// Inside MidtransAdapter.verifyWebhook()
verifyWebhook(payload: MidtransNotification, headers: any): WebhookResult {
  const expectedSignature = crypto
    .createHash('sha512')
    .update(payload.order_id + payload.status_code + payload.gross_amount + this.serverKey)
    .digest('hex');

  if (payload.signature_key !== expectedSignature) {
    throw new WebhookVerificationError('Invalid Midtrans signature');
  }
  // ... proceed only if verified
}

// Inside XenditAdapter.verifyWebhook()
verifyWebhook(payload: any, headers: Record<string, string>): WebhookResult {
  const callbackToken = headers['x-callback-token'];
  if (callbackToken !== this.configuredCallbackToken) {
    throw new WebhookVerificationError('Invalid Xendit callback token');
  }
  // ... proceed only if verified
}
```

### Defense Layer 2: Server-Side Payment Verification (DOUBLE CHECK)

Don't trust the webhook alone. After signature verification passes, call the payment gateway's API to confirm the payment status independently. This is belt-and-suspenders security.

```typescript
// After webhook signature is verified, ALSO check with gateway directly
async handleWebhook(payload: any, headers: any): Promise<WebhookHandleResult> {
  // Step 1: Verify webhook signature
  const webhookData = await this.gateway.verifyWebhook(payload, headers);

  // Step 2: Double-check with gateway's API
  const paymentStatus = await this.gateway.getPaymentStatus(webhookData.transactionId);

  if (paymentStatus.status !== 'PAID' && paymentStatus.status !== 'settlement') {
    throw new PaymentNotConfirmedError('Payment not confirmed by gateway API');
  }

  // Step 3: Verify amount matches what we expected
  const checkout = await this.storage.getCheckout(webhookData.orderId);
  if (paymentStatus.amount !== checkout.amount_price) {
    throw new AmountMismatchError(
      `Expected ${checkout.amount_price}, got ${paymentStatus.amount}`
    );
  }

  // Step 4: Credit tokens (with idempotency check)
  await this.ledger.credit(checkout.wallet_id, checkout.amount_tokens, {
    idempotencyKey: `checkout:${checkout.id}`,
    referenceType: 'checkout',
    referenceId: checkout.id,
  });
}
```

### Defense Layer 3: Idempotency (PREVENT DUPLICATES)

```typescript
// In the Ledger class
async credit(walletId: string, amount: number, options: CreditOptions): Promise<Transaction> {
  // Check if this exact operation already happened
  const existing = await this.storage.findTransactionByIdempotencyKey(options.idempotencyKey);

  if (existing) {
    // Already processed — return existing transaction, don't create duplicate
    return existing;
  }

  // Create new transaction (inside a database transaction for atomicity)
  return await this.storage.withTransaction(async (tx) => {
    const wallet = await tx.getWalletForUpdate(walletId);  // SELECT FOR UPDATE
    const newBalance = wallet.balance + amount;

    await tx.updateBalance(walletId, newBalance);
    return await tx.createTransaction({
      walletId,
      type: 'credit',
      amount,
      runningBalance: newBalance,
      idempotencyKey: options.idempotencyKey,
      referenceType: options.referenceType,
      referenceId: options.referenceId,
    });
  });
}
```

### Defense Layer 4: Atomic Balance Operations (PREVENT OVERDRAW)

```typescript
// In the Ledger class
async debit(walletId: string, amount: number, options: DebitOptions): Promise<Transaction> {
  return await this.storage.withTransaction(async (tx) => {
    // Lock the wallet row to prevent concurrent modifications
    const wallet = await tx.getWalletForUpdate(walletId);  // SELECT ... FOR UPDATE

    if (wallet.balance < amount) {
      throw new InsufficientBalanceError(
        `Need ${amount} tokens, only have ${wallet.balance}`
      );
    }

    const newBalance = wallet.balance - amount;
    await tx.updateBalance(walletId, newBalance);

    return await tx.createTransaction({
      walletId,
      type: 'debit',
      amount: -amount,
      runningBalance: newBalance,
      idempotencyKey: options.idempotencyKey,
      reason: options.reason,
      metadata: options.metadata,
    });
  });
}
```

The `SELECT ... FOR UPDATE` is the key. It locks the wallet row so that if two concurrent `spend()` calls hit at the same time, one waits for the other to finish. The second one sees the updated (lower) balance and correctly rejects if insufficient.

### Defense Layer 5: Webhook Endpoint Hardening

- **IP allowlisting** (optional but recommended): Midtrans and Xendit publish their webhook source IPs. You can optionally verify incoming webhooks come from those IPs.
- **HTTPS only**: Never accept webhooks over HTTP.
- **Rate limiting**: Rate-limit your webhook endpoint to prevent brute-force attempts.
- **Timeout on verification**: If the gateway API doesn't respond within 5 seconds during double-check, reject and let the webhook retry.
- **Logging**: Log every webhook attempt (success and failure) with IP, headers, and payload hash. Don't log sensitive data like full card numbers.

### Security Checklist for Your README

Include this in your SECURITY.md so builders know what's handled:

```text
✅ Webhook signature verification (per-gateway cryptographic check)
✅ Server-side payment confirmation (API double-check)
✅ Amount mismatch detection (expected vs actual payment)
✅ Idempotent token crediting (no double-credits from webhook retries)
✅ Atomic balance operations (database-level locking prevents overdraw)
✅ Append-only transaction ledger (full audit trail, no deletions)
⚠️  Builder responsibility: HTTPS, IP allowlisting, rate limiting on webhook endpoint
⚠️  Builder responsibility: Securing API keys in environment variables
```

---

## 11. To Fork or Not to Fork

### Why You Might Fork an Existing Project

The most tempting targets to fork would be **@user-credits** (small Node.js credit library) or the payment routing part of **go-payment** (Midtrans + Xendit connectors).

**Arguments for forking:**

- You get a head start — existing code for credit management or payment gateway connectors
- You inherit any existing users/stars (though @user-credits has ~100 stars, so minimal)
- If the original project is abandoned, forking keeps it alive and earns goodwill

### Why You Should NOT Fork (Strong Recommendation)

**1. The existing projects aren't close enough to be worth forking.**

@user-credits is tied to MongoDB (via Mongoose) and Stripe. You'd have to rip out and replace both the storage layer and the payment layer. At that point, you've rewritten 80% of the code. That's not a fork — that's a new project with extra baggage.

go-payment is written in Go, not TypeScript. You can't fork a Go project into a Node.js one. You could port the Midtrans/Xendit integration logic, but that's just reading their code for reference, not forking.

**2. Forking creates a dependency you don't control.**

When you fork, your project is permanently linked to the original in GitHub's UI. People see "forked from X" and assume you're a derivative. If the original project has issues (security problems, abandoned, bad reputation), your project inherits that perception. As a first-time open source creator trying to build your brand, you want a clean identity.

**3. License complications.**

Forking means you inherit the original license and must comply with it. @user-credits uses ISC (permissive, fine). But some projects use AGPL or have CLAs (Contributor License Agreements) that complicate things. Starting fresh with MIT means you have zero license headaches.

**4. Forking doesn't build the skills you need.**

Your goal isn't just to ship code — it's to learn how to create and maintain an open source project from scratch. That means making architecture decisions, setting up CI/CD, writing docs, managing issues, and building community. Forking skips the hardest and most valuable parts.

**5. For popularity, original projects win.**

Nobody gets famous for forking a 100-star library. "I built this" is a much better story than "I forked this and changed some stuff." The narrative of building something from scratch that fills a real gap — that's what gets HackerNews upvotes and Twitter engagement.

### What You SHOULD Do Instead

- **Study** existing projects. Read the source code of @user-credits, Lago, and go-payment. Understand their architecture decisions. Learn what they did well and where they fell short.
- **Reference** the Midtrans and Xendit integration patterns from go-payment. The webhook verification logic and API call patterns are useful reference material.
- **Credit** inspiration. In your README, add an "Inspired by" section listing projects you learned from. This is good open source etiquette and shows you've done your homework.
- **Build from scratch.** Start with a clean repo, your own architecture, your own design decisions. This gives you full ownership of the project's direction and narrative.

### The One Exception

If one of the larger projects (like Lago) specifically puts out a call for community adapters — e.g., "we want someone to build a Midtrans payment adapter plugin" — then contributing to that project (not forking, but contributing a PR) could get you visibility within their community. That's different from forking. But for your standalone project, build it fresh.

---

## 12. Accounting, Auditing & Reconciliation

### Why This Matters

You're building a system that handles money (indirectly). Even though payment gateways process the actual transactions, your library tracks who has how many tokens and why. If a builder's user says "I paid Rp 50,000 but only got 500 tokens instead of 1,000," the builder needs to prove what happened. If the builder's accountant asks "how much revenue came from token sales this month?", the data needs to be accurate and verifiable.

Getting this right from day one is what separates a toy project from something companies will actually trust in production.

### Principle 1: Double-Entry Ledger (The Foundation)

Every financial system that's serious about accuracy uses double-entry bookkeeping. The concept is simple: every transaction affects two accounts, and the total always balances to zero.

In your token wallet, think of it like this:

```text
When a user buys 1,000 tokens for Rp 50,000:
  DEBIT:  user_wallet     +1,000 tokens   (user gains tokens)
  CREDIT: revenue_pool    -1,000 tokens   (tokens "come from" somewhere)

When a user spends 50 tokens on a prompt:
  DEBIT:  usage_pool      +50 tokens      (tokens consumed)
  CREDIT: user_wallet     -50 tokens      (user loses tokens)
```

The key rule: **the sum of all debits and credits across the entire system must always equal zero.** If it doesn't, something went wrong and you can immediately detect it.

### Implementing This in Your Data Model

Expand the transaction table to support double-entry:

```text
┌────────────────────────────────┐
│      ledger_entries            │
├────────────────────────────────┤
│ id                             │
│ transaction_id  (groups a pair)│
│ account_type    (user_wallet,  │
│                  revenue,      │
│                  usage,        │
│                  refund,       │
│                  expired)      │
│ account_id      (user_id or   │
│                  system)       │
│ direction       (debit/credit) │
│ amount                         │
│ running_balance                │
│ created_at                     │
│ metadata (JSON)                │
└────────────────────────────────┘
```

Every operation creates exactly TWO ledger entries with the same `transaction_id`. This makes auditing trivial — you can verify the system is balanced with a single SQL query:

```sql
-- This should ALWAYS return 0. If it doesn't, you have a bug.
SELECT SUM(CASE WHEN direction = 'debit' THEN amount ELSE -amount END)
FROM ledger_entries;
```

### Principle 2: Append-Only (Never Modify History)

This is already in the design, but it's worth emphasizing WHY. In fintech, you never update or delete a transaction record. If something needs to be corrected, you create a new "reversal" or "adjustment" entry.

```typescript
// WRONG: Updating a transaction
await db.transactions.update({ id: txId, amount: newAmount }); // NEVER DO THIS

// RIGHT: Creating a reversal
await ledger.credit(walletId, originalAmount, { reason: 'reversal', referenceId: txId });
await ledger.debit(walletId, correctedAmount, { reason: 'correction', referenceId: txId });
```

This means you have a complete, immutable history of everything that ever happened. Auditors love this.

### Principle 3: Reconciliation Support

Reconciliation is the process of comparing two sets of records to make sure they match. For your token wallet, there are two reconciliations that builders need:

**Internal reconciliation** — Does the wallet balance match the sum of all ledger entries for that wallet?

```typescript
// Your library should provide this
const reconciliation = await wallet.reconcile(userId);
// Returns:
// {
//   walletBalance: 750,           // Current balance from wallets table
//   calculatedBalance: 750,       // Sum of all ledger entries
//   isBalanced: true,             // Do they match?
//   totalCredits: 5000,           // Total tokens ever purchased
//   totalDebits: 4250,            // Total tokens ever spent
//   entryCount: 847,              // Total ledger entries
// }
```

**External reconciliation** — Do the token credits in your system match the payments confirmed by the payment gateway?

```typescript
// Your library should provide this
const externalRecon = await wallet.reconcileWithGateway({
  from: new Date('2026-01-01'),
  to: new Date('2026-01-31'),
});
// Returns:
// {
//   gatewayPayments: 142,         // Payments confirmed by Midtrans/Xendit
//   walletCredits: 142,           // Token credit entries in your ledger
//   matched: 140,                 // Entries that match perfectly
//   mismatched: 2,                // Entries with discrepancies
//   mismatches: [
//     { checkoutId: 'abc', gatewayAmount: 50000, ledgerAmount: 45000, type: 'amount_mismatch' },
//     { checkoutId: 'def', gatewayStatus: 'paid', ledgerStatus: 'pending', type: 'status_mismatch' },
//   ]
// }
```

### Principle 4: Audit Trail

Every action should be traceable back to who did what, when, and why. Your ledger entries already capture most of this, but add these fields:

```typescript
interface AuditableTransaction {
  // ... existing fields ...
  initiatedBy: string;        // 'user', 'system', 'admin', 'webhook'
  sourceIp?: string;          // For user-initiated actions
  webhookId?: string;         // For payment-triggered credits
  gatewayTransactionId?: string; // Reference back to Midtrans/Xendit
  reason: string;             // Human-readable explanation
  metadata: Record<string, any>; // Flexible context
}
```

Provide a query API so builders can pull audit logs:

```typescript
const auditLog = await wallet.getAuditLog(userId, {
  from: new Date('2026-01-01'),
  to: new Date('2026-01-31'),
  type: 'all',    // or 'credit', 'debit', 'refund'
  limit: 100,
  offset: 0,
});
// Returns paginated list of all ledger entries with full context
```

### Principle 5: Reporting Hooks

Your library shouldn't build a full reporting dashboard (that's scope creep), but it should make it easy for builders to extract the data they need:

```typescript
// Summary for a time period
const summary = await wallet.getSummary({
  from: new Date('2026-01-01'),
  to: new Date('2026-01-31'),
});
// Returns:
// {
//   totalTokensSold: 500000,
//   totalTokensUsed: 423000,
//   totalRevenue: { IDR: 7500000 },     // From checkout records
//   uniqueUsers: 284,
//   topUpCount: 412,
//   averageTopUpSize: 1213,             // tokens per top-up
// }

// Export-friendly format
const csv = await wallet.exportTransactions({
  from: new Date('2026-01-01'),
  to: new Date('2026-01-31'),
  format: 'csv',   // or 'json'
});
```

This lets builders pipe the data into whatever reporting tool they use — Google Sheets, Metabase, custom dashboards, their accountant's Excel spreadsheet.

---

## 13. Margin Visibility: "Am I Losing Money?"

This is the killer feature that could set your project apart. Every AI product builder has two burning questions: "am I making money on each transaction?" and "what's my actual margin?" Most builders are flying blind because their token system doesn't connect to their AI cost data.

### The Core Concept

Your wallet knows two things: how much the user paid (from checkout records) and how many tokens were spent (from ledger entries). What it DOESN'T know natively is how much the AI call actually cost the builder. But the builder can tell you, via the `metadata` field in `spend()`.

```typescript
// Builder's code after every AI call
const aiResponse = await openai.chat.completions.create({ model: 'gpt-4o', ... });

// Calculate actual cost
const actualCost = calculateProviderCost(aiResponse.model, aiResponse.usage);

await wallet.spend(userId, walletTokensCost, {
  reason: 'ai-chat',
  metadata: {
    model: aiResponse.model,
    inputTokens: aiResponse.usage.prompt_tokens,
    outputTokens: aiResponse.usage.completion_tokens,
    providerCostUSD: actualCost,    // ← THIS IS THE KEY FIELD
    providerCostIDR: actualCost * exchangeRate,
  }
});
```

### Margin Report API

Once builders pass `providerCostIDR` (or `providerCostUSD`) in metadata, your library can generate margin reports:

```typescript
const margin = await wallet.getMarginReport({
  from: new Date('2026-01-01'),
  to: new Date('2026-01-31'),
});
// Returns:
// {
//   totalRevenue: 7500000,           // Rp — from token sales
//   totalProviderCost: 3200000,      // Rp — sum of providerCostIDR from metadata
//   grossProfit: 4300000,            // Rp — revenue minus cost
//   grossMarginPercent: 57.3,        // %
//
//   byModel: {
//     'gpt-4o': {
//       usage: 15420,                // total wallet tokens spent
//       revenue: 4500000,            // proportional revenue
//       providerCost: 2100000,       // actual AI cost
//       margin: 53.3,               // %
//     },
//     'gpt-3.5-turbo': {
//       usage: 8230,
//       revenue: 2000000,
//       providerCost: 320000,
//       margin: 84.0,               // Much higher margin on cheaper models
//     },
//     'claude-sonnet': {
//       usage: 4100,
//       revenue: 1000000,
//       providerCost: 780000,
//       margin: 22.0,               // Thin margin — maybe reprice?
//     },
//   },
//
//   alerts: [
//     { type: 'low_margin', model: 'claude-sonnet', margin: 22.0,
//       message: 'Claude Sonnet margin is below 30%. Consider adjusting token cost.' },
//   ]
// }
```

### "Am I Losing Money?" Alert

The most valuable thing you can do is tell a builder IMMEDIATELY when they're losing money on a specific model:

```typescript
// Optional: configure margin alerts
const wallet = new TokenWallet({
  // ... other config ...
  marginAlerts: {
    enabled: true,
    minimumMarginPercent: 20,    // Alert if any model drops below 20%
    webhook: process.env.SLACK_WEBHOOK_URL,  // Optional: send to Slack
    checkInterval: '1h',         // How often to check
  },
});

// Or check manually
const healthCheck = await wallet.getMarginHealth();
// Returns:
// {
//   overall: 'healthy',              // 'healthy', 'warning', 'critical'
//   overallMargin: 57.3,
//   modelsAtRisk: [
//     { model: 'claude-sonnet', margin: 22.0, status: 'warning' }
//   ],
//   modelsProfitable: [
//     { model: 'gpt-4o', margin: 53.3, status: 'healthy' },
//     { model: 'gpt-3.5-turbo', margin: 84.0, status: 'healthy' },
//   ]
// }
```

### Implementation Approach

This doesn't require a complex analytics engine. It's just aggregating data that already exists in your ledger:

1. Revenue per period = SUM of checkout `amount_price` where status is 'completed'
2. Provider cost per period = SUM of `metadata.providerCostIDR` from all debit ledger entries
3. Margin = (revenue - cost) / revenue * 100
4. Break down by `metadata.model` for per-model margin

The only requirement from the builder is passing the `providerCostIDR` or `providerCostUSD` in the `metadata` when calling `spend()`. If they don't pass it, the margin report simply shows "cost data not available" for those entries.

### Why This Is a Differentiator

No existing billing library does this. Lago, Flexprice, OpenMeter — they track usage and generate invoices, but they don't connect the dots between "what did the user pay" and "what did this AI call actually cost me." This is because traditional billing doesn't have the AI cost dimension. Your library is purpose-built for AI products, so it can solve this problem that general billing tools can't.

A builder choosing between rolling their own token system vs using your library would look at margin reporting and think "I'd have to build that myself otherwise — this library saves me weeks." That's a compelling reason to adopt.

### Revenue Attribution (Optional, Future)

For the ambitious v2, you could also help answer "which users are my most profitable?"

```typescript
const userProfitability = await wallet.getUserProfitability({
  from: startDate,
  to: endDate,
  sortBy: 'grossProfit',
  limit: 10,
});
// Returns top 10 most profitable users with:
// - totalSpent (wallet tokens)
// - totalPaid (money)
// - totalProviderCost
// - grossProfit per user
// - most-used models
```

This helps builders identify their power users and understand which pricing tiers are working.

---

## 14. Subscription Models (Future Roadmap)

These are NOT for v1. They're documented here as the vision for v2+ once the core token wallet is stable and adopted. The core philosophy stays the same: keep each model simple to configure, and let the builder choose which one fits their product.

### Model 1: Recurring Credit Top-Up

**What it is:** User subscribes to a plan that automatically adds tokens to their wallet every month (or week, or custom interval). Like a phone prepaid plan that auto-reloads.

**How it works:**

```typescript
// Builder configures subscription plans
const plans = [
  { id: 'basic',   tokens: 1000,  price: 25000,  interval: 'monthly',  currency: 'IDR' },
  { id: 'pro',     tokens: 5000,  price: 100000, interval: 'monthly',  currency: 'IDR' },
  { id: 'team',    tokens: 25000, price: 400000, interval: 'monthly',  currency: 'IDR' },
];

// User subscribes
await wallet.subscribe(userId, {
  planId: 'pro',
  startDate: new Date(),
  // Payment gateway handles recurring billing via:
  // - Midtrans: Subscription API or recurring card charges
  // - Xendit: Recurring payments API
});

// Every month, on renewal:
// 1. Payment gateway charges user's saved payment method
// 2. Webhook fires → wallet credits 5,000 tokens
// 3. Tokens accumulate (roll over) OR expire (configurable)
```

**Key design decisions:**

- **Do tokens roll over?** Builder configures: `rollover: true` (tokens accumulate) or `rollover: false` (unused tokens expire at end of billing cycle)
- **What if payment fails?** Grace period (configurable, e.g., 3 days), then pause the subscription. Tokens from previous successful payments remain usable.
- **Can user still buy extra tokens?** Yes. One-time top-ups work alongside subscriptions. The wallet just tracks total balance regardless of source.

### Model 2: Capped Usage (Like Claude Pro)

**What it is:** User pays a flat monthly fee and gets a fixed usage cap. Once they hit the cap, they either get throttled, blocked, or offered to buy more. This is how Claude Pro works — you pay $20/month and get a certain number of messages before hitting a limit.

**How it works:**

```typescript
// Builder configures capped plans
const cappedPlans = [
  {
    id: 'starter',
    price: 50000,               // Rp 50K/month
    interval: 'monthly',
    cap: 2000,                  // 2,000 tokens per billing cycle
    overagePolicy: 'block',     // Stop when cap hit
    currency: 'IDR',
  },
  {
    id: 'pro',
    price: 150000,
    interval: 'monthly',
    cap: 10000,
    overagePolicy: 'throttle',  // Slow down after cap
    currency: 'IDR',
  },
  {
    id: 'business',
    price: 500000,
    interval: 'monthly',
    cap: 50000,
    overagePolicy: 'overage',   // Allow overage at per-token price
    overageRate: 15,            // Rp 15 per extra token
    currency: 'IDR',
  },
];

// When user tries to spend:
await wallet.spend(userId, 50, { reason: 'ai-chat' });
// Library internally checks:
// 1. Is user on a capped plan?
// 2. How much of their cycle cap has been used?
// 3. Apply overage policy if cap exceeded

// Builder can check usage status
const status = await wallet.getUsageStatus(userId);
// Returns:
// {
//   plan: 'pro',
//   cycleStart: '2026-02-01',
//   cycleEnd: '2026-02-28',
//   capTotal: 10000,
//   capUsed: 7340,
//   capRemaining: 2660,
//   percentUsed: 73.4,
//   daysRemaining: 3,
//   projectedUsage: 8500,        // Based on current daily rate
//   willExceedCap: false,
// }
```

**Implementation note:** This model doesn't actually use a "balance" in the traditional sense. Instead, it tracks a "usage counter" per billing cycle that resets on renewal. The wallet table gains a `cycle_usage` field and a `cycle_reset_date` field. This is conceptually different from the top-up model but uses the same ledger underneath.

### Model 3: Unlimited Usage (Controlled)

**What it is:** User pays a flat fee and gets "unlimited" usage. In reality, the builder sets soft limits, fair-use policies, and rate limits to prevent abuse. This is how many SaaS products work — "unlimited" with fine print.

**How it works:**

```typescript
const unlimitedPlans = [
  {
    id: 'unlimited-pro',
    price: 300000,              // Rp 300K/month
    interval: 'monthly',
    type: 'unlimited',
    controls: {
      rateLimit: 100,           // Max 100 requests per hour
      dailyLimit: 1000,         // Max 1,000 tokens per day
      monthlyFairUse: 100000,   // Soft cap — flag for review above this
      modelRestrictions: ['gpt-3.5-turbo', 'gpt-4o-mini'],  // Only cheaper models
      // Premium models like GPT-4o or Claude Opus require per-token billing
    },
    currency: 'IDR',
  },
];

// Spend works the same way, but instead of checking balance, checks rate/limits
await wallet.spend(userId, 50, { reason: 'ai-chat' });
// Library checks:
// 1. Is user within rate limit? (100 req/hour)
// 2. Is user within daily limit? (1,000 tokens/day)
// 3. Is user within fair-use cap? (flag if exceeded)
// 4. Is the model allowed on this plan?

// Builder can check limit status
const limits = await wallet.getLimitStatus(userId);
// Returns:
// {
//   plan: 'unlimited-pro',
//   hourlyRequests: { used: 42, limit: 100, resetIn: '18m' },
//   dailyTokens: { used: 620, limit: 1000, resetIn: '6h' },
//   monthlyUsage: { used: 45000, fairUseThreshold: 100000, flagged: false },
//   allowedModels: ['gpt-3.5-turbo', 'gpt-4o-mini'],
// }
```

**Why "controlled" matters:** Without controls, one user on an unlimited plan could run up thousands of dollars in API costs for the builder. The controls ensure the builder's COGS stays predictable. The builder decides what "unlimited" means for their product.

### How These Fit Into the Architecture

The subscription models build ON TOP of the existing core, not replace it:

```text
v1 Core (ships first):
  └── Wallet (balance, spend, topUp)
  └── Ledger (transactions)
  └── Checkout (payment gateways)

v2 Subscription Layer (future):
  └── SubscriptionManager
      ├── RecurringTopUp   → uses Wallet.topUp() on a schedule
      ├── CappedPlan       → uses Wallet.spend() with cycle limit checks
      └── UnlimitedPlan    → uses Wallet.spend() with rate/limit checks
  └── SchedulerAdapter
      ├── CronAdapter      → simple cron-based renewal
      └── GatewayRecurring → Midtrans/Xendit recurring payment APIs
```

The key insight: **subscriptions are a layer on top, not a replacement.** A recurring top-up plan literally calls `wallet.topUp()` on a schedule. A capped plan calls `wallet.spend()` with an additional limit check. The core stays simple, and the subscription layer adds the business logic.

### Roadmap Priority

1. **v1.0:** One-time top-ups + spend (core wallet) ← Ship this first
2. **v1.5:** Recurring credit top-up (simplest subscription model, uses existing wallet.topUp)
3. **v2.0:** Capped usage plans (requires cycle tracking, usage counters)
4. **v2.5:** Unlimited plans with controls (requires rate limiting, fair-use monitoring)
5. **v3.0:** Plan management UI, plan switching, proration, upgrade/downgrade flows

Don't try to build all three subscription models at once. Ship v1 with just one-time purchases, get users, get feedback, then add subscription models based on what people actually ask for.

---

## 15. Modern Architecture & Engineering Best Practices

### Why This Matters for Open Source Adoption

Developers who evaluate open source libraries look at the code quality FIRST. If they see messy code, no tests, or outdated patterns, they close the tab. A well-engineered project signals "this is maintained by someone who knows what they're doing," which directly impacts adoption and your reputation.

### The Stack (Recommended)

```text
Language:        TypeScript 5.x (strict mode)
Runtime:         Node.js 20+ (LTS)
Package Manager: pnpm (faster, stricter than npm)
Monorepo:        Turborepo (fast builds, caching)
Build:           tsup (fast TypeScript bundler, outputs ESM + CJS)
Test:            Vitest (fast, native TypeScript, compatible with Jest API)
Lint:            Biome (replaces ESLint + Prettier, much faster)
ORM/Query:       Drizzle ORM (type-safe, lightweight, no heavy runtime)
Validation:      Zod (runtime type validation for configs and inputs)
CI:              GitHub Actions
Docs:            Starlight (Astro-based docs site) or Fumadocs (Next.js-based)
Changesets:      Changesets (automated versioning + changelogs)
```

### Why These Choices

**TypeScript strict mode** — Non-negotiable for financial code. `strict: true` in tsconfig catches null/undefined bugs that would cause balance errors. Also enable `noUncheckedIndexedAccess` for extra safety.

**pnpm** — The modern standard for monorepos. Stricter dependency resolution (prevents phantom deps), faster installs, built-in workspace support. Most serious TypeScript open source projects use pnpm now (tRPC, Hono, Drizzle all use it).

**Turborepo** — Handles the monorepo build orchestration. When you change `@token-wallet/core`, it knows to rebuild `@token-wallet/gateway-midtrans` too. Caches builds so CI is fast.

**tsup** — Bundles your TypeScript into both ESM and CommonJS outputs. This means your library works with `import` (modern) and `require()` (legacy). One config file, zero hassle. Way simpler than raw tsc or rollup.

**Vitest** — Drop-in replacement for Jest but 10x faster because it uses Vite's transform pipeline. Native TypeScript support without `ts-jest` configs. Same `describe/it/expect` API so anyone can write tests immediately.

**Biome** — Replaces both ESLint and Prettier with a single tool written in Rust. 100x faster than ESLint. One config file instead of the typical ESLint + Prettier + eslint-config-prettier nightmare. Newer projects are rapidly adopting it.

**Drizzle ORM** — Perfect for your storage adapters. Type-safe SQL queries with zero runtime overhead. Supports Postgres, MySQL, and SQLite from the same codebase. Lightweight (no heavy runtime like Prisma). Schema-as-code with migrations.

**Zod** — Validates configuration inputs at runtime. When a builder passes `{ gateway: 'midtrans', gatewayConfig: { ... } }`, Zod ensures the config is valid and gives clear error messages if something's wrong. This prevents "why isn't it working" issues.

### Project Structure (Modern Patterns)

```text
token-wallet/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── wallet.ts              # Main class
│   │   │   ├── ledger.ts              # Transaction ledger
│   │   │   ├── checkout.ts            # Checkout manager
│   │   │   ├── reconciliation.ts      # Reconciliation logic
│   │   │   ├── margin.ts              # Margin reporting
│   │   │   ├── errors.ts              # Custom error classes
│   │   │   ├── types.ts               # Public TypeScript interfaces
│   │   │   ├── schemas.ts             # Zod validation schemas
│   │   │   ├── index.ts               # Public API (only export what users need)
│   │   │   └── internal/              # Internal modules (not exported)
│   │   │       ├── idempotency.ts
│   │   │       └── locking.ts
│   │   ├── __tests__/
│   │   │   ├── wallet.test.ts
│   │   │   ├── ledger.test.ts
│   │   │   ├── idempotency.test.ts
│   │   │   └── fixtures/              # Test data
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   │
│   ├── gateway-midtrans/
│   │   ├── src/
│   │   │   ├── adapter.ts
│   │   │   ├── webhook.ts             # Webhook verification logic
│   │   │   ├── types.ts               # Midtrans-specific types
│   │   │   └── index.ts
│   │   ├── __tests__/
│   │   │   ├── adapter.test.ts
│   │   │   └── webhook.test.ts        # Test with real webhook payloads
│   │   └── package.json
│   │
│   ├── gateway-xendit/                # Same structure as midtrans
│   │
│   ├── storage-drizzle/               # Single storage package using Drizzle
│   │   ├── src/
│   │   │   ├── schema.ts             # Drizzle schema definitions
│   │   │   ├── adapter.ts            # StorageAdapter implementation
│   │   │   ├── migrations/           # SQL migration files
│   │   │   └── index.ts
│   │   └── package.json              # @token-wallet/storage-drizzle
│   │
│   └── token-wallet/                  # Meta-package
│       └── package.json
│
├── apps/
│   └── docs/                          # Documentation site
│
├── examples/
│   ├── nextjs/
│   ├── express/
│   └── hono/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Lint → Test → Build → Type-check
│       ├── release.yml                # Changeset → Publish to npm
│       └── codeql.yml                 # Security scanning
│
├── biome.json                         # Linting + formatting config
├── turbo.json                         # Monorepo build config
├── pnpm-workspace.yaml                # Workspace definition
├── tsconfig.base.json                 # Shared TS config
├── .changeset/                        # Changesets config
└── package.json
```

### Key Engineering Patterns

#### 1. Dependency Injection (not classes-everywhere OOP)

Use a functional approach with dependency injection. Pass dependencies as config, not as class hierarchies.

```typescript
// GOOD: Simple factory with injected dependencies
export function createWallet(config: WalletConfig): Wallet {
  const gateway = resolveGateway(config.gateway, config.gatewayConfig);
  const storage = resolveStorage(config.storage, config.storageConfig);
  const ledger = createLedger(storage);
  const checkout = createCheckout(gateway, storage, ledger);

  return {
    getBalance: (userId) => storage.getBalance(userId),
    spend: (userId, amount, opts) => ledger.debit(userId, amount, opts),
    topUp: (userId, opts) => checkout.createTopUp(userId, opts),
    handleWebhook: (payload, headers) => checkout.handleWebhook(payload, headers),
    reconcile: (userId) => reconcile(storage, userId),
    getMarginReport: (opts) => calculateMargin(storage, opts),
  };
}

// NOT: Deep class inheritance chains
// class AbstractWallet extends BaseFinancialEntity implements IWallet { ... }
```

#### 2. Error Handling with Custom Errors

```typescript
// Define specific error types builders can catch
export class TokenWalletError extends Error {
  constructor(message: string, public code: string) { super(message); }
}
export class InsufficientBalanceError extends TokenWalletError {
  constructor(public required: number, public available: number) {
    super(`Need ${required} tokens, only have ${available}`, 'INSUFFICIENT_BALANCE');
  }
}
export class WebhookVerificationError extends TokenWalletError {
  constructor(reason: string) {
    super(`Webhook verification failed: ${reason}`, 'WEBHOOK_INVALID');
  }
}
export class IdempotencyConflictError extends TokenWalletError {
  constructor(key: string) {
    super(`Operation already processed: ${key}`, 'IDEMPOTENCY_CONFLICT');
  }
}

// Builder can catch specific errors
try {
  await wallet.spend(userId, 100);
} catch (e) {
  if (e instanceof InsufficientBalanceError) {
    return res.status(402).json({ error: 'Not enough tokens', balance: e.available });
  }
  throw e; // Re-throw unexpected errors
}
```

#### 3. Strict TypeScript Config

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

#### 4. Semantic Versioning with Changesets

Every PR that changes behavior requires a changeset file:

```bash
pnpm changeset
# Prompts: which packages changed? major/minor/patch? description?
# Creates .changeset/cool-llamas-dance.md
```

On merge to main, GitHub Action creates a "Version Packages" PR that bumps versions and updates CHANGELOG. On merge of THAT PR, packages auto-publish to npm. This is how tRPC, Hono, and most modern TypeScript open source projects handle releases.

#### 5. CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request, push]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm biome ci .               # Lint + format check
      - run: pnpm turbo typecheck           # Type checking
      - run: pnpm turbo test                # Run all tests
      - run: pnpm turbo build               # Build all packages
```

#### 6. Export Map in package.json

Modern Node.js packages use the `exports` field so bundlers can tree-shake properly:

```json
{
  "name": "@token-wallet/core",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "engines": { "node": ">=20" },
  "peerDependencies": {
    "drizzle-orm": ">=0.35.0"
  }
}
```

---

## 16. Database Choice: PostgreSQL (Not MySQL)

### The Recommendation: PostgreSQL

For a financial/billing library in 2026, PostgreSQL is the clear winner. Here's why in plain terms.

### Why PostgreSQL

**`SELECT ... FOR UPDATE` works properly.** This is the row-locking mechanism that prevents two concurrent `spend()` calls from overdrawing a balance. PostgreSQL's implementation is rock-solid and well-documented. MySQL's InnoDB also supports this, but PostgreSQL's behavior is more predictable with its MVCC (multi-version concurrency control) model.

**Advisory locks.** PostgreSQL has a feature called "advisory locks" — application-level locks that are incredibly useful for idempotency checks. You can lock on a checkout ID while processing a webhook, ensuring that even if two webhook retries arrive simultaneously, only one processes.

**`SERIALIZABLE` isolation level actually works.** In PostgreSQL, `SERIALIZABLE` truly guarantees serializable transactions. In MySQL's InnoDB, the `SERIALIZABLE` level is actually `REPEATABLE READ` with some extra locking, which has subtle differences that can cause bugs in financial code.

**JSONB columns.** Your `metadata` field stores arbitrary JSON. PostgreSQL's `JSONB` type is indexable and queryable — you can write `WHERE metadata->>'model' = 'gpt-4o'` in your margin report queries. MySQL's JSON support exists but is less mature and harder to index.

**It's what the ecosystem uses.** Drizzle ORM's best support is for PostgreSQL. Most modern TypeScript projects (Vercel, Supabase, Neon, etc.) default to PostgreSQL. When developers set up your library, they're most likely already running PostgreSQL.

**Better for financial math.** PostgreSQL's `NUMERIC` type handles exact decimal arithmetic without floating-point rounding errors. Critical when you're tracking "Rp 50,000 paid for 1,000 tokens" — you don't want 49,999.99 showing up in reports.

### Why Not MySQL

MySQL isn't bad — millions of production systems use it. But for your specific use case (financial transactions, concurrent operations, JSON metadata), PostgreSQL has clear advantages. The main reason anyone picks MySQL is "we already use it" — and your library should accommodate that. But the DEFAULT and recommended setup should be PostgreSQL.

### How to Support Both (Via Drizzle)

Since you're using Drizzle ORM, supporting both databases is actually straightforward. Drizzle abstracts the SQL differences:

```typescript
// schema.ts — works with both Postgres and MySQL via Drizzle
import { pgTable, varchar, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
// OR
import { mysqlTable, varchar, int, timestamp, json } from 'drizzle-orm/mysql-core';

// The storage adapter uses Drizzle's query builder, which handles SQL dialect differences
```

In practice, ship with PostgreSQL as the primary and tested path. Accept community PRs for MySQL support. This is exactly what Lago does — PostgreSQL is the default, and they don't officially support MySQL at all.

### For the README

Just say: "PostgreSQL 15+ recommended. MySQL support is available via community adapter." This sets clear expectations without alienating MySQL users.

---

## 17. Currency Handling: Agnostic vs. Configured

### The Two Layers of "Currency" in Your System

This is important to get right because people confuse two things:

**Layer 1: Wallet tokens** — These are abstract units. They have no currency. "500 tokens" is "500 tokens." This layer is ALREADY currency-agnostic. Tokens are like arcade credits — they're an internal accounting unit.

**Layer 2: Real money** — This is what users pay when they buy tokens. Rp 50,000, $5 USD, ₱280 PHP. This layer is where the currency question matters.

So the real question is: **how should the library handle the money side?**

### Three Approaches (And Why Only One Is Right)

#### Approach A: Fully Currency-Agnostic (No Config)

The library stores whatever currency the builder passes per checkout. No validation, no opinions.

```typescript
// Builder can mix currencies freely
await wallet.topUp(userId, { amount: 1000, price: 50000, currency: 'IDR' });
await wallet.topUp(userId, { amount: 1000, price: 5, currency: 'USD' });
// Now the reporting is a mess — revenue is split across currencies
// Margin calculations break because COGS is in USD but revenue is in IDR + USD
```

**Problem:** Reporting becomes a nightmare. "How much revenue did I make this month?" can't be answered without exchange rate conversions. Margin reports break. Reconciliation becomes harder because you're comparing apples (IDR checkouts) and oranges (USD checkouts).

#### Approach B: Locked Currency at Install Time

The builder picks one currency during initialization. All checkouts must use it.

```typescript
const wallet = new TokenWallet({
  currency: 'IDR',  // Locked. All checkouts must be IDR.
  // ...
});

await wallet.topUp(userId, { amount: 1000, price: 50000 });
// Currency is implicit — always IDR
// Clean, simple, no mixed-currency problems

await wallet.topUp(userId, { amount: 1000, price: 5, currency: 'USD' });
// ERROR: Currency mismatch. Wallet is configured for IDR.
```

**Problem:** Too rigid. What if a builder serves both Indonesian and international users? They'd need to run two separate wallet instances. Also locks out multi-region expansion.

#### Approach C: Base Currency with Multi-Currency Checkout (RECOMMENDED)

Configure a **base currency** for reporting and accounting. Allow checkouts in any currency, but require the builder to provide the base-currency equivalent for each transaction. This keeps reporting clean while allowing payment flexibility.

```typescript
const wallet = new TokenWallet({
  baseCurrency: 'IDR',    // All reports, margins, reconciliation in IDR
  // ...
});

// Indonesian user pays in IDR — straightforward
await wallet.topUp(userId, {
  amount: 1000,
  price: 50000,
  currency: 'IDR',
  // baseCurrencyAmount not needed — it's already IDR
});

// International user pays in USD — builder provides the IDR equivalent
await wallet.topUp(userId, {
  amount: 1000,
  price: 3.20,
  currency: 'USD',
  baseCurrencyAmount: 51200,  // Builder's conversion: $3.20 × 16,000 = Rp 51,200
});
```

**Why this works:**

- All internal accounting is in one currency (IDR). Margin reports, revenue summaries, reconciliation — all clean.
- The actual payment happens in whatever currency the gateway supports. Midtrans charges in IDR. Stripe charges in USD/EUR/etc.
- The `baseCurrencyAmount` is provided by the builder, not the library. The library doesn't do exchange rate lookups. That's the builder's responsibility (they might use a fixed rate, live API, or whatever suits their business).
- If `currency` matches `baseCurrency`, `baseCurrencyAmount` is automatically set to `price`. Zero extra work for the common case.

### How This Shows Up in the Config

```typescript
const wallet = new TokenWallet({
  // Required
  gateway: 'midtrans',
  gatewayConfig: { ... },
  storage: 'drizzle',
  storageConfig: { ... },

  // Currency config (simple)
  baseCurrency: 'IDR',          // Default: 'IDR' (since your target market is Indonesia)
                                 // Builder changes to 'USD' if they're US-based, etc.
});
```

That's it. One field. Not a currency "selection wizard" or installation step. Just a config string.

### For the Checkout Table

```text
┌──────────────────────────┐
│       checkouts          │
├──────────────────────────┤
│ ...                      │
│ payment_currency   'USD' │  ← What the user actually paid in
│ payment_amount     3.20  │  ← How much they paid
│ base_currency      'IDR' │  ← Always the configured base currency
│ base_amount        51200 │  ← Equivalent in base currency
│ ...                      │
└──────────────────────────┘
```

All margin reports, revenue summaries, and reconciliation use `base_amount`. The `payment_currency` and `payment_amount` are stored for reference and gateway reconciliation.

### For the README

Document it simply:

> **Currency:** Configure your base currency once. All reporting uses this currency. Payments can be made in any currency your gateway supports — just provide the base-currency equivalent. Default: `IDR`.

### Edge Case: What If They Don't Set It?

Default to `IDR` since your target market is Indonesia. If someone installs the library and doesn't think about currency, it just works for the common case. They only need to touch the config if they're based elsewhere.

---

## 18. Use Cases That Won't Work (And Why That's Okay)

Every library has boundaries. Being clear about what you DON'T support is just as important as what you do. It prevents people from misusing the library, reduces support burden, and shows architectural maturity. Here's what won't work with the current design — and whether each is a future opportunity or an intentional exclusion.

### 1. User-to-User Token Transfers

**Scenario:** A marketplace where User A creates AI art and User B pays tokens to User A for it. Or a tipping system where users tip each other tokens.

**Why it doesn't work:** The current design only has system↔user flows. Tokens come from the system (via payment) and go to the system (via usage). There's no `wallet.transfer(fromUser, toUser, amount)` operation. Adding this would require escrow logic, dispute handling, and potentially money transmitter regulations depending on the jurisdiction.

**Should you add it?** Not in v1-v2. This fundamentally changes the system from a "prepaid billing tool" to a "virtual currency platform," which carries much heavier regulatory implications, especially in Indonesia where Bank Indonesia (BI) regulates e-money and stored-value instruments. Stay focused.

**What to tell users:** "Token Wallet manages prepaid credits for service consumption. For user-to-user transfers, you'll need a virtual currency platform with appropriate financial licenses."

### 2. Refunds Back to Original Payment Method

**Scenario:** User bought 1,000 tokens for Rp 50,000 via GoPay. Used 200. Wants the remaining 800 tokens refunded back to their GoPay balance.

**Why it doesn't work:** Your library can reverse the token balance (credit back 800 tokens), but it can't trigger a money refund through the payment gateway. Each gateway has its own refund API with different rules — Midtrans has a refund window, Xendit requires specific refund endpoints, and some payment methods (like VA bank transfers) can't be refunded at all.

**Should you add it?** Partial — add a `wallet.requestRefund()` that marks the transaction as "refund requested" and provides the builder with the information they need to process the refund through the gateway. But the actual gateway refund API call should be the builder's responsibility, because refund policies vary wildly by business.

```typescript
// What you COULD provide (v2+)
const refundRequest = await wallet.requestRefund(userId, {
  tokens: 800,
  reason: 'customer_request',
});
// Returns: { checkoutId, gatewayRef, paymentMethod, originalAmount, refundableAmount }
// Builder then calls Midtrans/Xendit refund API themselves
```

### 3. Team/Organization Shared Wallets

**Scenario:** A company buys a pool of 50,000 tokens. 10 employees draw from the same pool. Each employee's usage is tracked individually but the balance is shared.

**Why it doesn't work:** The current data model is `user_id → wallet`. One user, one wallet. There's no concept of "organization" or "shared wallet with multiple authorized users." Adding this requires authorization logic (who's allowed to spend from the org wallet?), per-member usage tracking within a shared balance, and org-level admin controls.

**Should you add it?** Yes, but as a v3+ feature. B2B SaaS products universally need this. The architecture can support it by adding an `org_wallets` table and a `wallet_members` table that maps users to shared wallets. The `spend()` function would check both the user's personal wallet and any org wallets they belong to.

**What to tell users:** "v1 supports per-user wallets. Team/organization wallets are on the v3 roadmap."

### 4. B2B Net-30 Invoicing (Post-Pay)

**Scenario:** An enterprise customer doesn't want to prepay for tokens. They want to use tokens freely, get invoiced at the end of the month, and pay within 30 days.

**Why it doesn't work:** The entire architecture assumes prepaid credits. `canSpend()` checks if the balance is sufficient. `spend()` deducts from an existing balance. There's no concept of "credit line" or "negative balance allowed."

**Should you add it?** Not directly. This is a fundamentally different billing model (postpaid vs prepaid). However, you could hack around it: create a "virtual top-up" that gives the enterprise user a large balance (e.g., 1,000,000 tokens) at the start of the month with no payment, then reconcile at month end. But this is a workaround, not a proper solution.

**What to tell users:** "Token Wallet is a prepaid credit system. For postpaid/invoice-based billing, consider Lago or build a postpaid layer on top of our ledger."

### 5. Real-Time Streaming Billing

**Scenario:** A voice AI app that processes audio in real-time. Each second of audio costs 0.3 tokens. A 10-minute call should deduct 180 tokens, but it needs to happen continuously (not all at once at the end).

**Why it doesn't work:** Calling `wallet.spend(userId, 0.3)` every second creates enormous database pressure — 600 transactions for a 10-minute call. The `SELECT FOR UPDATE` locking on every call would create a bottleneck. And if the database is slow for even 100ms, you're backing up the real-time pipeline.

**Should you add it?** Yes, with a buffering pattern (v2+):

```typescript
// Future API: Start a streaming session
const session = await wallet.startSession(userId, {
  estimatedCost: 200,           // Pre-authorize (hold) this many tokens
  maxCost: 500,                 // Hard cap
});

// During streaming — accumulates locally, no DB calls
session.accumulate(0.3);        // Called every second
session.accumulate(0.3);

// At end of stream — single DB transaction
const result = await session.finalize();
// Deducts total accumulated amount in one atomic operation
// Returns unused hold back to balance
```

This batches hundreds of micro-transactions into a single database write. The pre-authorization ensures the user has enough tokens before streaming starts.

**What to tell users:** "For streaming/real-time billing, use batch deduction — accumulate costs in memory and call spend() once at the end. Session-based billing with pre-authorization is on the v2 roadmap."

### 6. Pay-Per-Result (Not Pay-Per-Attempt)

**Scenario:** An AI image generator that sometimes fails. The user shouldn't be charged when the AI returns an error. But with the current design, the builder calls `spend()` before the AI call (to ensure balance) or after (to deduct). If they call before and the AI fails, the user already lost tokens. If they call after, a user with 0 balance could trigger an expensive AI call.

**Why it's tricky:** There's a timing problem. You need to "hold" tokens before the AI call and "confirm" or "release" them after.

**Should you add it?** Yes. This is the "authorization/capture" pattern from credit cards, and it's actually not hard:

```typescript
// Hold tokens before AI call
const hold = await wallet.hold(userId, 20, { reason: 'image-gen-attempt' });
// Balance is reduced by 20, but tokens are "held" not "spent"

try {
  const result = await generateImage(prompt);
  // Success — confirm the hold (converts to actual spend)
  await wallet.capture(hold.id);
} catch (error) {
  // Failed — release the hold (tokens return to balance)
  await wallet.release(hold.id);
}
```

This requires a `holds` table and a `held_balance` field on the wallet. `canSpend()` checks `balance - held_balance`. This is a great v1.5 feature — it's not complex but adds real value.

### 7. Token Expiration with Legal Compliance

**Scenario:** User buys 1,000 tokens. 6 months later, 400 are unused. The builder wants to expire them. But in some jurisdictions, prepaid credits purchased with real money can't just "expire" — the user may be entitled to a refund of unused credits.

**Why it's tricky:** Token expiration is a technical feature, but the legality varies by country. In Indonesia, BI regulations for stored-value instruments have specific rules about expiration. In the EU, prepaid credits have consumer protection rules. In California, gift card laws may apply.

**Should you add it?** Add the technical capability (expiration dates on credits, automated expiration jobs), but clearly document that builders are responsible for legal compliance in their jurisdiction. The library should provide the mechanism, not the legal opinion.

```typescript
// Technical capability — builder is responsible for legal compliance
await wallet.topUp(userId, {
  amount: 1000,
  price: 50000,
  currency: 'IDR',
  expiresAt: new Date('2026-08-28'),  // Optional: tokens expire after 6 months
});

// Expiration check runs on a schedule
// Expired tokens are moved to an 'expired' account in the ledger
// Full audit trail preserved
```

**What to tell users:** "Token Wallet supports optional token expiration. Builders must ensure their expiration policies comply with local consumer protection laws."

### 8. Crypto/Blockchain Token Integration

**Scenario:** "Token wallet" sounds like it should work with blockchain tokens, NFTs, or cryptocurrency payments.

**Why it doesn't work:** Despite sharing the word "token," this library has zero blockchain functionality. Wallet tokens are database entries, not on-chain assets. There's no smart contract, no wallet address, no gas fees.

**Should you add it?** No. This is a completely different domain. Mixing traditional billing with blockchain adds enormous complexity (wallet management, gas optimization, chain confirmations, MEV protection) with minimal benefit for the target use case.

**What to tell users:** Clarify in the README: "Token Wallet manages application credits, not cryptocurrency. For blockchain-based tokens, look at [wagmi/viem] or similar Web3 libraries."

### 9. Multi-Product / Multi-Wallet Per User

**Scenario:** A company has three AI products — a chatbot, an image generator, and a document processor. They want users to have separate token balances for each product, or a shared balance with per-product spending limits.

**Why it's partially supported:** The current design is one wallet per user. A builder could work around this by using different `user_id` schemes (like `user123:chatbot`, `user123:imagegen`), but that's hacky and breaks margin reporting.

**Should you add it?** Yes, as a v2 feature. Allow multiple wallets per user with tags:

```typescript
// Future API
const chatBalance = await wallet.getBalance(userId, { tag: 'chatbot' });
const imageBalance = await wallet.getBalance(userId, { tag: 'imagegen' });

// Or a unified balance with per-product spend tracking
await wallet.spend(userId, 50, { product: 'chatbot', reason: 'gpt-4o-prompt' });
```

### 10. Freemium with Daily Free Credits

**Scenario:** "Every user gets 10 free tokens per day. If they want more, they buy a package." Like the free tier of many AI tools.

**Why it's tricky:** The library doesn't have a concept of "free credits that reset." You'd need a scheduler that calls `wallet.topUp()` every day for every user (could be millions of users — expensive). Or a virtual balance that doesn't actually create ledger entries.

**Should you add it?** Yes, but with a smart implementation (v2):

```typescript
// Future API: Free tier config
const wallet = new TokenWallet({
  // ...
  freeTier: {
    enabled: true,
    dailyTokens: 10,
    // Implemented as a "virtual balance" that resets
    // No ledger entries for free tokens (keeps DB clean)
    // Only paid tokens go through the full ledger
  },
});

// getBalance returns: { paid: 500, free: 7, total: 507 }
// spend() deducts from free first, then paid (or configurable)
```

### Summary Table

| Use Case | Works Now? | Priority | Complexity |
| --- | --- | --- | --- |
| User-to-user transfers | No | Not planned | High + regulatory |
| Refund to payment method | No | v2 | Medium |
| Team/org shared wallets | No | v3 | Medium |
| B2B postpaid invoicing | No | Not planned | High (different model) |
| Streaming/real-time billing | Partial | v2 | Medium |
| Pay-per-result (hold/capture) | No | v1.5 | Low-Medium |
| Token expiration | No | v1.5 | Low |
| Crypto/blockchain tokens | No | Never | N/A (different domain) |
| Multi-wallet per user | No | v2 | Medium |
| Freemium daily free credits | No | v2 | Medium |

### Why This Section Matters

Including a "Limitations" or "Not Supported" section in your README is a sign of a mature project. It:

- **Saves people time** — they know immediately if this fits their use case
- **Reduces issue noise** — fewer "does it support X?" issues
- **Shows architectural clarity** — you understand the boundaries of your design
- **Builds trust** — honesty about limitations makes your supported features more credible

The best open source READMEs (like go-payment's) include an honest limitations section. Do the same.

---

## 19. Testing Strategy: TDD Is Non-Negotiable

### The Short Answer

Yes, TDD. But **not TestSprite, and not Playwright either** — at least not as your primary testing tool. Here's why.

### TestSprite vs Playwright: Wrong Tools for This Job

Both TestSprite and Playwright solve the **wrong problem** for your project.

**TestSprite** is an AI-powered testing SaaS ($6.7M seed raised, 35K+ users, MCP server integration with Claude Code). It auto-generates tests and boosts AI-generated code pass rates from 42% to 93%. Impressive, but it's designed for **application-level testing** — UI flows, API endpoints, full-stack apps. Your token wallet is a **library**, not an application. There's no UI to test. There's no running server to hit. TestSprite would try to test the *examples* built with your library, not the library itself.

**Playwright** is Microsoft's browser automation tool for end-to-end testing. It opens real browsers, clicks buttons, fills forms. Your library has no browser, no buttons, no forms. Playwright is perfect for testing the **Next.js example app** that uses your library, but not the library core.

**What you actually need:** Unit tests and integration tests that run against your TypeScript code directly. The tool for that is **Vitest** (already in the recommended stack from Section 15).

### Where TestSprite DOES Fit

TestSprite isn't your *testing framework*, but it can be a **development accelerator**. Its MCP server integrates with Claude Code, so while you're building, you can ask it to help generate test cases you might have missed. Think of it as a copilot for writing tests, not the test runner.

Workflow: You write library code in Claude Code → TestSprite MCP suggests edge cases → You review and add them to your Vitest suite → Vitest runs them in CI.

This way your project never depends on a paid SaaS for testing. Contributors can run tests locally without signing up for anything. Open source projects must keep their CI pipeline free and self-contained.

### The Right Testing Stack

```text
Unit Tests:        Vitest (fast, native TypeScript, Jest-compatible API)
Integration Tests: Vitest + Testcontainers (real PostgreSQL in Docker)
Webhook Tests:     Vitest + fixture payloads (captured from real gateways)
E2E App Tests:     Playwright (ONLY for example apps, not the library)
AI Assist:         TestSprite MCP (during dev to find edge cases, not in CI)
Coverage:          Vitest v8 provider (90%+ enforced in CI)
```

### TDD for Payment Code: What It Looks Like

TDD means: write the test first, watch it fail, write the code to make it pass, refactor. For a token wallet:

#### Layer 1: Unit Tests (80% of your tests)

Test individual functions in isolation. No database, no network.

```typescript
// wallet.test.ts
describe('Wallet.canSpend', () => {
  it('returns true when balance is sufficient', () => {
    const wallet = createTestWallet({ balance: 100 });
    expect(wallet.canSpend(50)).toBe(true);
  });

  it('returns false when balance is insufficient', () => {
    const wallet = createTestWallet({ balance: 30 });
    expect(wallet.canSpend(50)).toBe(false);
  });

  it('returns true when balance exactly equals amount', () => {
    // This test documents a design decision
    const wallet = createTestWallet({ balance: 50 });
    expect(wallet.canSpend(50)).toBe(true);
  });

  it('throws on negative amount', () => {
    const wallet = createTestWallet({ balance: 100 });
    expect(() => wallet.canSpend(-10)).toThrow('Amount must be positive');
  });

  it('throws on zero amount', () => {
    const wallet = createTestWallet({ balance: 100 });
    expect(() => wallet.canSpend(0)).toThrow('Amount must be positive');
  });
});
```

```typescript
// webhook-verification.test.ts
describe('Midtrans Webhook Verification', () => {
  it('accepts valid SHA512 signature', () => {
    const adapter = createMidtransAdapter({ serverKey: 'test-server-key' });
    const payload = {
      order_id: 'order-123',
      status_code: '200',
      gross_amount: '50000.00',
      signature_key: computeExpectedSig('order-123', '200', '50000.00', 'test-server-key'),
    };
    expect(() => adapter.verifyWebhook(payload, {})).not.toThrow();
  });

  it('rejects invalid signature', () => {
    const adapter = createMidtransAdapter({ serverKey: 'test-server-key' });
    const payload = {
      order_id: 'order-123',
      status_code: '200',
      gross_amount: '50000.00',
      signature_key: 'definitely-wrong',
    };
    expect(() => adapter.verifyWebhook(payload, {})).toThrow(WebhookVerificationError);
  });

  it('rejects when signature field is missing', () => {
    const adapter = createMidtransAdapter({ serverKey: 'test-server-key' });
    const payload = { order_id: 'order-123', status_code: '200', gross_amount: '50000.00' };
    expect(() => adapter.verifyWebhook(payload, {})).toThrow(WebhookVerificationError);
  });
});
```

```typescript
// idempotency.test.ts
describe('Idempotency', () => {
  it('rejects duplicate credit with same idempotency key', async () => {
    const ledger = createTestLedger();
    const key = 'checkout:abc123';

    const tx1 = await ledger.credit(walletId, 1000, { idempotencyKey: key });
    expect(tx1.amount).toBe(1000);

    // Same key again → returns existing, no duplicate
    const tx2 = await ledger.credit(walletId, 1000, { idempotencyKey: key });
    expect(tx2.id).toBe(tx1.id);
    expect(await ledger.getBalance(walletId)).toBe(1000); // NOT 2000
  });
});
```

#### Layer 2: Integration Tests (15% of your tests)

Test with a real database using Testcontainers (spins up PostgreSQL in Docker automatically):

```typescript
// integration/spend-flow.test.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';

describe('Spend Flow (Integration)', () => {
  let container;
  let wallet;

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    wallet = createWallet({
      storage: 'drizzle',
      storageConfig: { connectionString: container.getConnectionUri() },
      gateway: 'mock',
    });
    await wallet.migrate();
  });

  afterAll(async () => { await container.stop(); });

  it('prevents overdraw under concurrent spend calls', async () => {
    await wallet.directCredit('user-1', 100);

    // Two concurrent spend(80) calls
    const [r1, r2] = await Promise.allSettled([
      wallet.spend('user-1', 80, { reason: 'test-1' }),
      wallet.spend('user-1', 80, { reason: 'test-2' }),
    ]);

    // One succeeds, one fails
    const successes = [r1, r2].filter(r => r.status === 'fulfilled');
    const failures = [r1, r2].filter(r => r.status === 'rejected');
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    // Balance should be 20, not -60
    expect(await wallet.getBalance('user-1')).toBe(20);
  });

  it('full flow: webhook → credit → spend → reconcile', async () => {
    const checkout = await wallet.topUp('user-2', {
      amount: 500, price: 25000, currency: 'IDR',
    });

    await wallet.handleWebhook(
      createMockWebhookPayload(checkout.id, 'settlement'),
      createMockWebhookHeaders()
    );

    expect(await wallet.getBalance('user-2')).toBe(500);
    await wallet.spend('user-2', 150, { reason: 'gpt-4o' });
    expect(await wallet.getBalance('user-2')).toBe(350);

    const recon = await wallet.reconcile('user-2');
    expect(recon.isBalanced).toBe(true);
  });
});
```

#### Layer 3: E2E Tests (5% — example apps only, using Playwright)

```typescript
// examples/nextjs/e2e/buy-tokens.spec.ts
import { test, expect } from '@playwright/test';

test('user can buy tokens and see updated balance', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Balance: 0 tokens')).toBeVisible();
  await page.getByRole('button', { name: 'Buy 1000 tokens' }).click();
  // Mock payment flow...
  await expect(page.getByText('Balance: 1000 tokens')).toBeVisible();
});
```

### Must-Have Test Cases Before v0.1

**Webhook Security:**

- Valid signature → accepted
- Invalid/missing/tampered signature → rejected
- Replay attack (same webhook twice) → idempotent, no double credit
- Amount mismatch (webhook vs checkout) → rejected

**Balance Integrity:**

- Spend with sufficient balance → succeeds
- Spend with insufficient balance → InsufficientBalanceError, balance unchanged
- Concurrent spends → no overdraw
- Credit after valid payment → balance increases
- Credit without matching checkout → rejected

**Idempotency:**

- Same key twice → one transaction
- Different keys → separate transactions
- Survives server restart (DB-level)

**Reconciliation:**

- Wallet balance = sum of ledger entries
- Double-entry balances to zero
- No orphaned checkouts

### Coverage: 90%+ or CI Fails

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['packages/core/src/**', 'packages/gateway-*/src/**'],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
});
```

### Summary: Right Tool, Right Job

| Need | Tool | When |
| --- | --- | --- |
| Unit tests (logic, errors) | Vitest | Every PR, mandatory |
| Integration tests (DB, flows) | Vitest + Testcontainers | Every PR, mandatory |
| Webhook verification | Vitest + fixture payloads | Every PR, mandatory |
| E2E (example apps) | Playwright | Pre-release only |
| AI test generation help | TestSprite MCP | During dev, not in CI |
| Coverage enforcement | Vitest v8 | Every PR, mandatory |

---

*Research compiled on February 28, 2026. Market data and star counts are approximate and may have changed.*
