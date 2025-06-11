import {getIt} from 'get-it'
import {promise} from 'get-it/middleware'

const requester = getIt([promise()])

export interface RequestOptions {
  method?: string
  body?: string
  headers?: Record<string, string>
}

export interface ResponseData {
  statusCode: number
  statusMessage: string
  body: Buffer
}

export function request(url: string, options?: RequestOptions): Promise<ResponseData> {
  return requester({...options, headers: {accept: '*/*', ...options?.headers}, rawBody: true, url})
}
