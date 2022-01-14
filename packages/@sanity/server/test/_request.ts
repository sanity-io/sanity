import getIt from 'get-it'
import jsonResponse from 'get-it/lib/middleware/jsonResponse'
import promise from 'get-it/lib/middleware/promise'

export const _request: (opts: {url: string}) => Promise<any> = getIt([jsonResponse(), promise()])
