import {type BifurClient} from '@sanity/bifur-client'
import {of} from 'rxjs'

export function createMockBifurClient(): BifurClient {
  const data: {requests: Record<string, any>} = {
    requests: {
      presence: [],
    },
  }

  return {
    request: (id: string) => {
      return of(data.requests[id] || null)
    },
  } as any
}
