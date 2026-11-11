import type { Tour } from '../tutorial/source'
import { info } from '../tutorial/steps'

export const createSendWhenReadyTour = (): Tour => ({
	id: 'send-when-ready',
	title: 'Send when ready',
	summary: 'Write now, send later, or send when quota returns.',
	steps: [
		info('Write while you are out of quota', 'Type your message, then click the clock icon in the composer. Nothing is sent yet.'),
		info('Pick the moment', 'Choose a time, or choose a counter that is empty right now. A counter trigger waits for a real increase seen by the quota tracker.'),
		info('You stay in control', 'Before anything is sent you get a 10-second countdown with Send now and Keep waiting. Up to 5 messages can wait, and each one only sends in the conversation where you scheduled it.'),
		info('Know the limits', 'The tab must stay open. ChatGPT only updates its counters on page load and after sends, so a time trigger is more reliable there.')
	]
})
