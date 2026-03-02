# Landing Page CTA Research — Murai Docs

**Goal:** Add a "Try the Demo" entry point to guide users to `murai-docs.vercel.app` without hurting primary conversion on the Starlight docs landing page at `ebuntario.github.io/murai`.

---

## 1. Current State

The Murai docs hero (`index.mdx`) has **2 CTAs**:
- **"Get Started"** (primary, solid) → `/murai/getting-started/installation/`
- **"View on GitHub"** (secondary, outline/external icon) → `github.com/ebuntario/murai`

The live demo at `murai-docs.vercel.app` is **not referenced anywhere** in the docs, README, or package.json files.

---

## 2. Conversion Data — Why NOT 3 Hero CTAs

| Finding | Source |
|---------|--------|
| Adding a **second conversion goal** can decrease conversions by **266%** | [UXPin](https://www.uxpin.com/studio/blog/landing-pages-guide/) |
| Single CTA in emails increases clicks by **371%** and sales by **1,617%** | [WordStream via Act-On](https://act-on.com/learn/blog/how-many-ctas-should-i-use/) |
| Personalized CTAs perform **202% better** than generic ones | [WiserNotify](https://wisernotify.com/blog/call-to-action-stats/) |
| "Don't confuse the issue by asking visitors to do more than one thing" — dedicated pages should have a **single primary CTA** | [WebDesignerDepot](https://www.webdesignerdepot.com/2019/12/should-a-web-page-have-a-single-cta/) |
| HubSpot: "The only place we absolutely advise against a secondary CTA is on your **landing pages**" | [HubSpot](https://blog.hubspot.com/marketing/everything-marketers-should-know-secondary-calls-to-action) |

**Verdict:** 3 buttons in the hero is a conversion anti-pattern. The user was right — max 2 buttons in the hero, with 1 prominent primary CTA. The demo link needs a different home.

---

## 3. OSS Library Benchmarks — Where Do They Put Demos?

| Library | Hero CTAs | Demo/Playground Placement |
|---------|-----------|---------------------------|
| **shadcn/ui** | 2 ("Get Started", "View Components") | **Navbar** — "Playground" link in examples dropdown |
| **Tailwind CSS** | 1 ("Get started") | **Navbar + Footer** — `play.tailwindcss.com` link |
| **Prisma** | 2 ("Create database", `npx prisma init`) | No public playground |
| **Drizzle ORM** | 2 ("Get Started", "Documentation") | **Below hero section** — "Live demo" link for Drizzle Studio; also **"Studio" in navbar** |
| **tRPC** | 2 ("Star", "Quickstart") | **Below hero** — "Try it out for yourself" section with StackBlitz sandboxes |
| **TanStack Query** | Could not fully render (SPA) | Typically has examples section below hero |
| **Zod** | 1 (announcement-style) | No public playground |

### Pattern Summary

**No top OSS library puts a demo/playground link as a 3rd hero CTA.** The universal pattern is:

1. **Hero:** Max 2 CTAs — primary ("Get Started") + secondary ("GitHub" or "Docs")
2. **Demo access via one of:**
   - **Navbar link** (shadcn, Tailwind, Drizzle) — persistent, visible on every page
   - **Dedicated section below hero** (tRPC, Drizzle) — contextual, shown after value proposition
   - **Footer** (Tailwind) — supplementary discovery path

---

## 4. Recommended Approach for Murai

### Option A: Navbar Link (Recommended)

**Add "Live Demo" as a nav item** in the Starlight sidebar or top navigation.

| Pros | Cons |
|------|------|
| Visible on **every page**, not just landing | Starlight's navbar customization is limited |
| Follows shadcn/Tailwind pattern | Requires Starlight config change |
| Doesn't touch hero conversion flow | |
| External link icon signals "opens new tab" | |

**Implementation:** Starlight supports `social` links in the header and custom `sidebar` items with external URLs. A `social` link or custom nav component could work.

### Option B: Below-Hero Section on Landing Page

**Add a callout/card section** after the feature grid: "See it in action → Try the live demo app"

| Pros | Cons |
|------|------|
| Follows tRPC/Drizzle pattern | Only visible on landing page |
| Contextual — shown after features | User must scroll to discover |
| Doesn't compete with hero CTAs | |
| Can include screenshot/preview | |

**Implementation:** Add an `<aside>` or Starlight `<Card>` component after the feature `<CardGrid>` in `index.mdx`.

### Option C: Replace "View on GitHub" Hero CTA

**Swap** "View on GitHub" → "Try the Demo" as the secondary hero CTA. Move GitHub link to navbar (Starlight already has the GitHub social link in the header).

| Pros | Cons |
|------|------|
| Maximum visibility for demo | Loses GitHub CTA from hero (but it's already in header) |
| Still only 2 CTAs | Breaks the standard OSS pattern of hero → GitHub |
| "Try the Demo" is higher-intent than "View on GitHub" | May confuse users expecting source code link |

### Option D: Hybrid — Navbar + Below-Hero (Best Coverage)

Combine Options A and B:
1. **Navbar:** Persistent "Live Demo" link visible from every docs page
2. **Landing page:** Callout section after features with preview/description

This matches how **Drizzle ORM** handles it (navbar "Studio" link + below-hero "Live demo" section) and gives two non-competing discovery paths.

---

## 5. Recommendation

**Go with Option D (Hybrid)** — it provides the best discoverability without touching the hero CTA conversion flow:

1. **Starlight social/nav link** → `murai-docs.vercel.app` (visible on all pages)
2. **"See it in action" card** on `index.mdx` below the feature grid (contextual discovery after reading value props)

Keep the hero exactly as-is: **"Get Started" (primary) + "View on GitHub" (secondary)**.

---

## Sources

- [Unbounce — 15 CTA Examples](https://unbounce.com/conversion-rate-optimization/call-to-action-examples/)
- [WiserNotify — 25 CTA Statistics](https://wisernotify.com/blog/call-to-action-stats/)
- [Moosend — Landing Page Best Practices](https://moosend.com/blog/landing-page-best-practices/)
- [LandingPageFlow — CTA Placement Strategies](https://www.landingpageflow.com/post/best-cta-placement-strategies-for-landing-pages)
- [HubSpot — Secondary CTAs](https://blog.hubspot.com/marketing/everything-marketers-should-know-secondary-calls-to-action)
- [UXPin — Landing Pages Guide](https://www.uxpin.com/studio/blog/landing-pages-guide/)
- [WebDesignerDepot — Single CTA](https://www.webdesignerdepot.com/2019/12/should-a-web-page-have-a-single-cta/)
- [Act-On — How Many CTAs](https://act-on.com/learn/blog/how-many-ctas-should-i-use/)
- [Toptal — Landing Page UX](https://www.toptal.com/designers/ux/landing-page-design-best-practices)
- [Hotjar — CTA Best Practices](https://www.hotjar.com/product-forge/CTA-best-practices/)
