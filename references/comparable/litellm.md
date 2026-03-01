# LiteLLM - README Reference

**Source:** github.com/BerriAI/litellm | **Stars:** 27,500+ | **License:** MIT

## Key Patterns to Learn From

- **Clear value prop:** "Call 100+ LLMs in OpenAI format" — everyone understands this instantly
- **Two deployment options** clearly separated: SDK (for devs) vs Gateway (for teams)
- **Notable adopters section** — Stripe, Google, Netflix, OpenAI — massive credibility signal
- **Performance claims with specifics:** "8ms P95 latency at 1k RPS"
- **Extensive provider table** — shows breadth of support at a glance
- **Multiple use case sections** (LLMs, Agents, MCP Tools) — shows versatility

## Original Content Summary

LiteLLM is a Python SDK and AI Gateway (Proxy Server) for calling 100+ LLM APIs in OpenAI format. Supports Bedrock, Azure, OpenAI, VertexAI, Cohere, Anthropic, Sagemaker, HuggingFace, VLLM, NVIDIA NIM. Features: cost tracking, guardrails, load balancing, comprehensive logging. AI Gateway provides centralized authentication, multi-tenant cost tracking. Python SDK provides direct integration with Router for retry/fallback.

## What Murai Can Copy

- "Call X using Y format" is a powerful README pattern — e.g., "Add token billing to any AI app in 5 minutes"
- Show real adopters/users as early as possible
- Separate SDK vs hosted options if you ever offer both
- Performance benchmarks add credibility
