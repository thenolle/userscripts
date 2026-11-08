declare const __VERSION__: string
declare function GM_getValue<T>(key: string, defaultValue: T): T
declare function GM_setValue<T>(key: string, value: T): void
declare function GM_registerMenuCommand(caption: string, onClick: () => void): number
declare function GM_unregisterMenuCommand(id: number): void
declare function cloneInto<T>(object: T, target: unknown, options?: object): T
declare const unsafeWindow: Window & typeof globalThis
declare function exportFunction<T extends Function>(fn: T, target: unknown, options?: { defineAs?: string, allowCrossOriginArguments?: boolean }): T

interface GmResponse {
  status: number
  responseText: string
}

declare function GM_xmlhttpRequest(details: { method: 'GET', url: string, timeout?: number, onload: (response: GmResponse) => void, onerror: () => void, ontimeout: () => void }): void