# Flexprice - README Reference

**Source:** github.com/flexprice/flexprice | **Stars:** 3,500+ | **License:** AGPL v3 + Commercial

## Key Patterns to Learn From

- **Problem-first README** — explains "Why Billing Is a Developer Problem" BEFORE showing the solution
- **Pain points section** — inflexible tools, complex metering, vendor lock-in, delayed monetization
- **"How Flexprice Solves This"** maps solutions to each pain point
- **Feature sections with detail** — each feature (metering, credits, pricing, entitlements, invoicing) gets its own subsection
- **Multiple quick links** — Docs, Demo video, Website, LinkedIn, X, Slack Community
- **make commands** — `make dev-setup`, `make restart-flexprice`, `make down`
- **Open Core licensing** clearly explained — 99% AGPL, 1% commercial

## Original Content Summary

Flexprice is monetization infrastructure for AI-native companies. Supports usage-based, credit-based, and hybrid pricing with real-time metering. SDKs for Go, Python, JavaScript. Uses PostgreSQL, Kafka, ClickHouse, and Temporal. Docker Compose setup with dedicated UI ports for each service. Emphasizes developer-first, API-first design. Applications send usage events via SDKs, Flexprice handles aggregation, metering, and billing logic in real-time.

## What Token Wallet Can Copy

- **Problem-first approach is powerful** — explain the pain BEFORE the solution
- List specific pain points your target users face
- Map your features directly to those pain points
- `make` commands simplify onboarding for contributors
- Be transparent about licensing model upfront
- Demo video link (Loom) — shows the product in action without requiring setup
