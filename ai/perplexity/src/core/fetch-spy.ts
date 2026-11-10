import { FetchSpy } from '@nolly/core'

export interface SpiedRequest {
  readonly url: string
  readonly method: string
  readonly accountId: string | null
}

export const fetchSpy = new FetchSpy<SpiedRequest>((request) => ({
  url: request.url,
  method: request.method,
  accountId: request.header('x-pplx-account')
}))
