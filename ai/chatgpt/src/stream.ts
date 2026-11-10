import type { SseMessage } from '@nolly/ai'
import { parseJson, parseLimits, record, text } from './payloads'
import type { LimitProgress } from './payloads'

export type ChatEvent =
	| { readonly type: 'conversation'; readonly id: string }
	| { readonly type: 'user-message'; readonly id: string; readonly text: string }
	| { readonly type: 'model'; readonly slug: string | null; readonly experience: string | null; readonly plan: string | null }
	| { readonly type: 'limits'; readonly limits: readonly LimitProgress[] }
	| { readonly type: 'complete' }

const userText = (message: Record<string, unknown> | null): string => {
	const parts = record(message?.['content'])?.['parts']
	return Array.isArray(parts) ? parts.filter((part): part is string => typeof part === 'string').join('\n') : ''
}

export const interpret = (message: SseMessage): ChatEvent[] => {
	if (message.data === '[DONE]') return [{ type: 'complete' }]
	const data = record(parseJson(message.data))
	if (!data) return []
	switch (text(data['type'])) {
		case 'resume_conversation_token': {
			const id = text(data['conversation_id'])
			return id ? [{ type: 'conversation', id }] : []
		}
		case 'input_message': {
			const input = record(data['input_message'])
			const id = text(input?.['id'])
			return id ? [{ type: 'user-message', id, text: userText(input) }] : []
		}
		case 'server_ste_metadata': {
			const meta = record(data['metadata'])
			return [{ type: 'model', slug: text(meta?.['model_slug']), experience: text(meta?.['requested_model_experience']), plan: text(meta?.['plan_type']) }]
		}
		case 'conversation_detail_metadata': {
			const limits = parseLimits(data)
			return limits.length ? [{ type: 'limits', limits }] : []
		}
		case 'message_stream_complete':
			return [{ type: 'complete' }]
		default:
			return []
	}
}
