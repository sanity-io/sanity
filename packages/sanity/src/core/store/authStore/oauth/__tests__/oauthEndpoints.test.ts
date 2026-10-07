import {describe, expect, it, vi} from 'vitest'

import {createOAuthEndpoints, OAuthRequestError, OAuthRequestTimeoutError} from '../oauthEndpoints'

function respond(status: number, body: unknown) {
  return vi.fn<typeof fetch>(
    async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), {status}),
  )
}

const EXCHANGE = {
  clientId: 'oc-1',
  redirectUri: 'http://localhost:3333',
  code: 'c',
  codeVerifier: 'v',
}

describe('oauthEndpoints', () => {
  it('posts the code exchange as a form without credentials', async () => {
    const fetchImpl = respond(200, {access_token: 'a', token_type: 'bearer', expires_in: 3600})
    await createOAuthEndpoints('https://api.sanity.io', fetchImpl).exchangeCode(EXCHANGE)

    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://api.sanity.io/v1/auth/oauth/token')
    expect(init).toMatchObject({method: 'POST', credentials: 'omit'})
    expect(Object.fromEntries(new URLSearchParams(String(init?.body)))).toEqual({
      grant_type: 'authorization_code',
      client_id: 'oc-1',
      redirect_uri: 'http://localhost:3333',
      code: 'c',
      code_verifier: 'v',
    })
  })

  it.each([
    ['an empty body', ''],
    ['a non-JSON body', 'ok'],
    ['a missing access token', {token_type: 'bearer', expires_in: 3600}],
    ['a non-bearer token type', {access_token: 'a', token_type: 'mac', expires_in: 3600}],
    ['a non-positive lifetime', {access_token: 'a', token_type: 'bearer', expires_in: 0}],
    [
      'an empty refresh token',
      {access_token: 'a', token_type: 'Bearer', expires_in: 60, refresh_token: ''},
    ],
  ])('rejects a successful response with %s', async (_label, body) => {
    const endpoints = createOAuthEndpoints('https://api.sanity.io', respond(200, body))
    await expect(endpoints.exchangeCode(EXCHANGE)).rejects.toThrow('malformed token response')
    await expect(endpoints.refresh({clientId: 'oc-1', refreshToken: 'r'})).rejects.toThrow(
      'malformed token response',
    )
  })

  it('reports the OAuth error code of a failed request', async () => {
    const endpoints = createOAuthEndpoints(
      'https://api.sanity.io',
      respond(400, {error: 'invalid_grant', error_description: 'used'}),
    )
    const error = await endpoints.refresh({clientId: 'oc-1', refreshToken: 'r'}).catch((e) => e)

    expect(error).toBeInstanceOf(OAuthRequestError)
    expect(error).toMatchObject({statusCode: 400, error: 'invalid_grant'})
  })

  it('times out a request that never answers, as a transient error', async () => {
    const hanging = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('', 'AbortError')))
        }),
    )
    const endpoints = createOAuthEndpoints('https://api.sanity.io', hanging, 10)

    const error = await endpoints.refresh({clientId: 'oc-1', refreshToken: 'r'}).catch((e) => e)

    expect(error).toBeInstanceOf(OAuthRequestTimeoutError)
    expect(error).not.toBeInstanceOf(OAuthRequestError)
  })
})
