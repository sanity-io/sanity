import {getIt} from 'get-it'
// eslint-disable-next-line import/extensions
import {promise} from 'get-it/middleware'

const request = getIt([promise()])

export class HttpError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HttpError'
  }

  statusCode?: number
}

export async function getUrlHeaders(url: string, headers = {}): Promise<Record<string, string>> {
  const response = await request({
    url,
    stream: true,
    maxRedirects: 0,
    method: 'HEAD',
    headers,
  })

  if (response.statusCode >= 400) {
    const error = new HttpError(`Request returned HTTP ${response.statusCode}`)
    error.statusCode = response.statusCode
    throw error
  }

  response.body.resume()
  return response.headers
}
