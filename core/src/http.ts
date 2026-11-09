export interface RequestOptions {
  readonly method?: 'GET' | 'POST'
  readonly headers?: Record<string, string>
  readonly body?: string
  readonly timeout?: number
}

export const request = (url: string, { method = 'GET', headers, body, timeout = 15_000 }: RequestOptions = {}): Promise<string> => {
  if (typeof GM_xmlhttpRequest !== 'function') {
    return fetch(url, { method, headers, body, cache: 'no-store' }).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.text()
    })
  }
  return new Promise((resolve, reject) =>
    GM_xmlhttpRequest({
      method,
      url,
      timeout,
      ...(headers ? { headers } : {}),
      ...(body !== undefined ? { data: body } : {}),
      onload: (response) => (response.status >= 200 && response.status < 300 ? resolve(response.responseText) : reject(new Error(`HTTP ${response.status}`))),
      onerror: () => reject(new Error('Network error')),
      ontimeout: () => reject(new Error('Request timed out'))
    })
  )
}

export const getText = (url: string, timeout?: number): Promise<string> => request(url, timeout === undefined ? {} : { timeout })

export const getJson = async <T>(url: string, timeout?: number): Promise<T> => JSON.parse(await getText(url, timeout)) as T
