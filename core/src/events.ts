import type { Teardown } from './scope'

type Listener = (payload: unknown) => void

export class Emitter<Events extends { [key: string]: unknown }> {
	private readonly listeners = new Map<keyof Events, Set<Listener>>()

	on<K extends keyof Events>(name: K, listener: (payload: Events[K]) => void): Teardown {
		const set = this.listeners.get(name) ?? new Set<Listener>()
		set.add(listener as Listener)
		this.listeners.set(name, set)
		return () => set.delete(listener as Listener)
	}

	emit<K extends keyof Events>(name: K, payload: Events[K], onError?: (error: unknown) => void): void {
		for (const listener of this.listeners.get(name) ?? []) {
			try {
				listener(payload)
			} catch (error) {
				onError?.(error)
			}
		}
	}

	once<K extends keyof Events>(name: K, listener: (payload: Events[K]) => void): Teardown {
		const off = this.on(name, (payload) => {
			off()
			listener(payload)
		})
		return off
	}
}
