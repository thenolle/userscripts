export const httpGet = (url: string, timeout = 15_000): Promise<string> => typeof GM_xmlhttpRequest === 'function' ? new Promise((resolve, reject) =>
  GM_xmlhttpRequest({
    method: 'GET',
    url,
    timeout,
    onload: (response) => (response.status >= 200 && response.status < 300 ? resolve(response.responseText) : reject(new Error(`HTTP ${response.status}`))),
    onerror: () => reject(new Error('Network error')),
    ontimeout: () => reject(new Error('Request timed out'))
  })
) : fetch(url, { cache: 'no-store' }).then((response) => {
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
})