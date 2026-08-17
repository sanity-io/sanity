import {type ProxyRequest, type ProxyResponse, writeResponseHead} from '@repo/debug-proxy'

/**
 * CORS headers for every mock response. The studio authenticates with an
 * `Authorization` header (token mode), which makes its requests
 * non-simple — the browser preflights them, and both the preflight and the
 * actual response must carry these headers.
 */
export function corsHeaders(req: ProxyRequest): Record<string, string> {
  const originHeader = req.headers.origin
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader
  return typeof origin === 'string'
    ? {
        'access-control-allow-origin': origin,
        'access-control-allow-credentials': 'true',
        'vary': 'origin',
      }
    : {'access-control-allow-origin': '*'}
}

export function handlePreflight(req: ProxyRequest, res: ProxyResponse): void {
  const requestedHeaders = req.headers['access-control-request-headers']
  writeResponseHead(res, 204, undefined, {
    ...corsHeaders(req),
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers':
      (Array.isArray(requestedHeaders) ? requestedHeaders.join(', ') : requestedHeaders) ||
      'authorization, content-type',
    'access-control-max-age': '600',
  })
  res.end()
}

/** Write a JSON response (with CORS) and return the body size in bytes. */
export function json(
  req: ProxyRequest,
  res: ProxyResponse,
  status: number,
  body: unknown,
  extraHeaders: Record<string, string> = {},
): number {
  const payload = JSON.stringify(body)
  const bytes = Buffer.byteLength(payload)
  writeResponseHead(res, status, undefined, {
    ...corsHeaders(req),
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(bytes),
    ...extraHeaders,
  })
  res.end(payload)
  return bytes
}

export function readBody(req: ProxyRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}
