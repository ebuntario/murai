import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://ebuntario.github.io',
	base: '/murai/',
	integrations: [
		starlight({
			title: 'Murai',
			description: 'Payment-gateway-agnostic token wallet for AI/SaaS applications',
			social: {
				github: 'https://github.com/ebuntario/murai',
			},
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quick Start', slug: 'getting-started/quickstart' },
						{
							label: 'Project Structure',
							slug: 'getting-started/project-structure',
						},
					],
				},
				{
					label: 'Guides',
					items: [
						{
							label: 'Next.js Integration',
							slug: 'guides/nextjs-integration',
						},
						{
							label: 'Webhook Verification',
							slug: 'guides/webhook-verification',
						},
						{
							label: 'Choosing a Gateway',
							slug: 'guides/choosing-a-gateway',
						},
						{ label: 'Architecture', slug: 'guides/architecture' },
					],
				},
				{
					label: 'API Reference',
					items: [
						{ label: 'Core', slug: 'api-reference/core' },
						{
							label: 'Gateway: Midtrans',
							slug: 'api-reference/gateway-midtrans',
						},
						{
							label: 'Gateway: Xendit',
							slug: 'api-reference/gateway-xendit',
						},
						{
							label: 'Storage: Drizzle',
							slug: 'api-reference/storage-drizzle',
						},
						{ label: 'Types', slug: 'api-reference/types' },
						{ label: 'Errors', slug: 'api-reference/errors' },
					],
				},
			],
		}),
	],
});
