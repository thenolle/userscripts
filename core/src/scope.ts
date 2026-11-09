export type Teardown = () => void

export class Scope {
	private teardowns: Teardown[] = []

	add(teardown: Teardown): Teardown {
		this.teardowns.push(teardown)
		return teardown
	}

	listen(target: EventTarget, type: string, listener: EventListener, options?: AddEventListenerOptions): Teardown {
		target.addEventListener(type, listener, options)
		return this.add(() => target.removeEventListener(type, listener, options))
	}

	interval(callback: () => void, ms: number): Teardown {
		const id = window.setInterval(callback, ms)
		return this.add(() => window.clearInterval(id))
	}

	timeout(callback: () => void, ms: number): Teardown {
		const id = window.setTimeout(callback, ms)
		return this.add(() => window.clearTimeout(id))
	}

	dispose(): void {
		const pending = this.teardowns.reverse()
		this.teardowns = []
		for (const teardown of pending) {
			try {
				teardown()
			} catch {
				continue
			}
		}
	}
}
