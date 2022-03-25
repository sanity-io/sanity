import getIt from 'get-it'
import promise from 'get-it/lib/middleware/promise'

export const _request: (opts: {url: string}) => Promise<{body: string; statusCode: number}> = getIt(
  [promise()]
)
