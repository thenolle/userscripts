type PageWindow = Window & typeof globalThis

export const getPageWindow = (): PageWindow | null => {
  if (typeof unsafeWindow !== 'undefined' && unsafeWindow) return unsafeWindow
  return (window as unknown as { wrappedJSObject?: PageWindow }).wrappedJSObject ?? null
}