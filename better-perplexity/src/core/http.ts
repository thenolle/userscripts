import { getText } from '@nolly/core'

export const httpGet = (url: string, timeout = 15_000): Promise<string> => getText(url, timeout)
