import type { LimitDefinition, LimitKey, Plan, SettingField, Status } from './types'

const DAY = 86_400_000

export const LIMITS: Readonly<Record<LimitKey, LimitDefinition>> = {
	remaining_pro: { label: 'Pro Search', total: 200, period: 'Reset schedule not supplied', window: 7 * DAY },
	remaining_research: { label: 'Deep Research', total: 20, period: 'Reset schedule not supplied', window: 30 * DAY },
	remaining_agentic_research: { label: 'Computer / Agentic', total: null, period: 'Reset schedule not supplied', window: 7 * DAY },
	remaining_labs: { label: 'Labs', total: 25, period: 'Reset schedule not supplied', window: 30 * DAY }
}

export const LIMIT_KEYS = Object.keys(LIMITS) as LimitKey[]

export const PLAN_DEFAULTS: Readonly<Record<Plan, Readonly<Record<LimitKey, number | null>>>> = {
	free: { remaining_pro: 3, remaining_research: 1, remaining_agentic_research: null, remaining_labs: null },
	paid: {
		remaining_pro: LIMITS.remaining_pro.total,
		remaining_research: LIMITS.remaining_research.total,
		remaining_agentic_research: LIMITS.remaining_agentic_research.total,
		remaining_labs: LIMITS.remaining_labs.total
	},
	unknown: { remaining_pro: null, remaining_research: null, remaining_agentic_research: null, remaining_labs: null }
}

export const windowFor = (key: LimitKey, plan: Plan): number => (plan === 'free' && key === 'remaining_pro' ? DAY : LIMITS[key].window)

export const MODE_MAP: readonly { readonly match: RegExp; readonly key: LimitKey }[] = [
	{ match: /deep\s*research|research/i, key: 'remaining_research' },
	{ match: /computer|agentic/i, key: 'remaining_agentic_research' },
	{ match: /\blabs?\b/i, key: 'remaining_labs' },
	{ match: /pro|search/i, key: 'remaining_pro' }
]

export const STATUS_LABELS: Readonly<Record<Status, string>> = {
	healthy: 'OK',
	low: 'Warning',
	critical: 'Critical',
	empty: 'Empty',
	unavailable: 'Unknown',
	reported: 'Reported'
}

export const SETTINGS_FIELDS: readonly SettingField[] = [
	{ key: 'subscription_status', label: 'Subscription status', type: 'string' },
	{ key: 'subscription_source', label: 'Subscription source', type: 'string' },
	{ key: 'upload_limit', label: 'Upload Limit', type: 'number' },
	{ key: 'pages_limit', label: 'Pages Limit', type: 'number' },
	{ key: 'create_limit', label: 'Create Limit', type: 'number' },
	{ key: 'article_image_upload_limit', label: 'Image Upload Limit', type: 'number' },
	{ key: 'daily_attachment_limit', label: 'Daily Attachments', type: 'number' },
	{ key: 'disable_training', label: 'Training Disabled', type: 'bool' },
	{ key: 'has_ai_profile', label: 'AI Profile', type: 'bool' },
	{ key: 'default_model', label: 'Default Model', type: 'string' },
	{ key: 'default_image_generation_model', label: 'Image Model', type: 'string' },
	{ key: 'default_video_generation_model', label: 'Video Model', type: 'string' },
	{ key: 'subscription_tier', label: 'Plan tier', type: 'string' },
	{ key: 'stripe_status', label: 'Stripe status', type: 'string' },
	{ key: 'revenuecat_status', label: 'RevenueCat status', type: 'string' },
	{ key: 'query_count', label: 'Queries (total)', type: 'number' },
	{ key: 'query_count_copilot', label: 'Copilot queries (total)', type: 'number' },
]

export const SOURCE_LABELS: Readonly<Record<string, string>> = {
	apple_healthkit: 'Apple Health',
	asana_mcp_merge: 'Asana',
	bmj: 'BMJ',
	box: 'Box',
	cbinsights_mcp_cashmere: 'CBInsights',
	confluence_mcp_merge: 'Confluence',
	crunchbase: 'Crunchbase',
	dropbox: 'Dropbox',
	factset: 'FactSet',
	gcal: 'Google Calendar',
	github_mcp_direct: 'GitHub',
	google_drive: 'Google Drive',
	jira_mcp_merge: 'Jira',
	linear_alt: 'Linear',
	microsoft_teams_mcp_merge: 'Microsoft Teams',
	midpage: 'Midpage',
	nejm: 'NEJM',
	notion_mcp: 'Notion',
	onedrive: 'OneDrive',
	openrouter: 'OpenRouter',
	org: 'Organization',
	outlook: 'Outlook',
	pitchbook_mcp_cashmere: 'Pitchbook',
	rsc: 'RSC',
	scholar: 'Scholar',
	sharepoint: 'SharePoint',
	slack_direct: 'Slack',
	social: 'Social',
	statista_mcp_cashmere: 'Statista',
	visualdx: 'VisualDx',
	web: 'Web',
	wiley_mcp_cashmere: 'Wiley'
}
