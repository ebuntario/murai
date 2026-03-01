# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Murai, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please use [GitHub's private vulnerability reporting](https://github.com/ebuntario/murai/security/advisories/new) with:

1. A description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to release a fix within 7 days for critical issues.

## Scope

The following are in scope for security reports:

- **Webhook signature verification** — bypass, timing attacks, replay attacks
- **Idempotency enforcement** — double-credit, race conditions
- **Balance integrity** — overdraft, integer overflow, negative balance
- **SQL injection** — via Drizzle ORM queries
- **Secret exposure** — API keys, server keys in logs or error messages

## Security Measures

Murai implements the following security measures:

- **Timing-safe webhook verification** — `crypto.timingSafeEqual` for both Midtrans (SHA512) and Xendit (callback token)
- **Idempotency keys** — unique constraints at both application and database levels
- **SELECT FOR UPDATE** — row-level locking prevents concurrent overdrafts
- **No raw SQL** — all queries go through Drizzle ORM's parameterized query builder
