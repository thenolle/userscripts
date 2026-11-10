import type { ConversationRef, PlatformAdapter } from '@nolly/ai'
import { isOwnUi } from './dom'
import { findAttachButton, findComposerForm, findHeaderSlot, findModeToggles, findPrimaryAction, findSendButton, findSidebar, findStopButton, labelOf, locateEditable, rejectEditable } from './locate'

const CHAT_PATH = /^\/(?:g\/g-p-[0-9a-f]+[^/]*\/)?c\/([^/?#]+)/
const PROJECT_PATH = /^\/g\/(g-p-[0-9a-f]+)/

export const parseConversation = (url: URL): ConversationRef => {
	const raw = CHAT_PATH.exec(url.pathname)?.[1]
	const id = raw ? decodeURIComponent(raw) : null
	const projectId = PROJECT_PATH.exec(url.pathname)?.[1] ?? null
	const temporary = url.searchParams.get('temporary-chat') === 'true' || (id?.startsWith('local-chatgpt:') ?? false)
	return { id, projectId, temporary }
}

const brief = (element: Element | null): Record<string, unknown> | null => element ? {
	tag: element.tagName.toLowerCase(),
	label: labelOf(element).slice(0, 40),
	pressed: element.getAttribute('aria-pressed'),
	expanded: element.getAttribute('aria-expanded')
} : null

export const chatgptAdapter: PlatformAdapter = {
	id: 'chatgpt',
	name: 'ChatGPT',
	isOwnUi,
	locateComposer: locateEditable,
	rejectEditable,
	findSendButton,
	findStopButton,
	sendWith: 'button',
	conversation: () => parseConversation(new URL(location.href)),
	findHeaderSlot,
	describePage: () => ({
		path: location.pathname,
		conversation: parseConversation(new URL(location.href)),
		composerForm: findComposerForm() !== null,
		composer: brief(locateEditable()),
		primaryAction: (() => {
			const action = findPrimaryAction()
			return action ? { kind: action.kind, ...brief(action.element) } : null
		})(),
		attach: brief(findAttachButton()),
		modeToggles: findModeToggles().map(({ element }) => brief(element)),
		headerSlot: findHeaderSlot() !== null,
		sidebar: findSidebar() !== null
	})
}
