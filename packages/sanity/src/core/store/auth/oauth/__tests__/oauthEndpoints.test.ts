import {describe, expect, it, vi} from 'vitest'

import {createOAuthEndpoints, OAuthRequestError, OAuthRequestTimeoutError} from '../oauthEndpoints'

function respond(status: number, body: unknown) {
  return vi.fn<typeof fetch>(
    async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), {status}),
  )
}

const HOSTS = {issuer: 'https://api.sanity.io', projectId: 'p1'}

const EXCHANGE = {
  clientId: 'oc-1',
  redirectUri: 'http://localhost:3333',
  code: 'c',
  codeVerifier: 'v',
}

describe('oauthEndpoints', () => {
  it('posts the code exchange as a form without credentials', async () => {
    const fetchImpl = respond(200, {access_token: 'a', token_type: 'bearer', expires_in: 3600})
    await createOAuthEndpoints(HOSTS, fetchImpl).exchangeCode(EXCHANGE)

    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://p1.api.sanity.io/v1/auth/oauth/token')
    expect(init).toMatchObject({method: 'POST', credentials: 'omit'})
    expect(Object.fromEntries(new URLSearchParams(String(init?.body)))).toEqual({
      grant_type: 'authorization_code',
      client_id: 'oc-1',
      redirect_uri: 'http://localhost:3333',
      code: 'c',
      code_verifier: 'v',
    })
  })

  it('sends token and revoke requests to the project host, which applies its CORS origins', async () => {
    // The issuer's own host only allows a fixed list of origins (localhost, sanity.studio), so a
    // studio anywhere else could never exchange its code there, whatever the project allows.
    const fetchImpl = respond(200, {access_token: 'a', token_type: 'bearer', expires_in: 3600})
    const endpoints = createOAuthEndpoints(
      {issuer: 'https://api.sanity.work', projectId: 'p1'},
      fetchImpl,
    )
    await endpoints.exchangeCode(EXCHANGE)
    await endpoints.refresh({clientId: 'oc-1', refreshToken: 'r'})
    await endpoints.revoke({clientId: 'oc-1', token: 't'})

    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      'https://p1.api.sanity.work/v1/auth/oauth/token',
      'https://p1.api.sanity.work/v1/auth/oauth/token',
      'https://p1.api.sanity.work/v1/auth/oauth/revoke',
    ])
  })

  it('sends the user to the issuer to authorize', () => {
    const url = new URL(
      createOAuthEndpoints({issuer: 'https://api.sanity.work', projectId: 'p1'}).authorizeUrl({
        clientId: 'oc-1',
        redirectUri: 'http://localhost:3333',
        codeChallenge: 'c',
        state: 's',
      }),
    )
    expect(`${url.origin}${url.pathname}`).toBe('https://api.sanity.work/v1/auth/oauth/authorize')
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
    const endpoints = createOAuthEndpoints(HOSTS, respond(200, body))
    await expect(endpoints.exchangeCode(EXCHANGE)).rejects.toThrow('malformed token response')
    await expect(endpoints.refresh({clientId: 'oc-1', refreshToken: 'r'})).rejects.toThrow(
      'malformed token response',
    )
  })

  it('reports the OAuth error code of a failed request', async () => {
    const endpoints = createOAuthEndpoints(
      HOSTS,
      respond(400, {error: 'invalid_grant', error_description: 'used'}),
    )
    const error = await endpoints.refresh({clientId: 'oc-1', refreshToken: 'r'}).catch((e) => e)

    expect(error).toBeInstanceOf(OAuthRequestError)
    expect(error).toMatchObject({statusCode: 400, error: 'invalid_grant'})
  })

  it('recognises the error code in the token endpoint error body the API sends today', async () => {
    // The API wraps its OAuth errors in its generic error shape (`error` is the HTTP reason
    // phrase, the code is only in `message`) instead of the RFC 6749 body. Until that is fixed
    // server side, a refused refresh token must still be recognised as `invalid_grant`, or the
    // studio cannot tell a dead session from a transient failure.
    const fetchImpl = respond(400, {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid grant: refresh token is invalid',
    })
    const err = await createOAuthEndpoints(HOSTS, fetchImpl)
      .refresh({clientId: 'oc-1', refreshToken: 'r'})
      .catch((e: unknown) => e)

    expect(err).toBeInstanceOf(OAuthRequestError)
    expect((err as OAuthRequestError).error).toBe('invalid_grant')
    expect((err as OAuthRequestError).statusCode).toBe(400)
  })

  it('times out a request that never answers, as a transient error', async () => {
    const hanging = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('', 'AbortError')))
        }),
    )
    const endpoints = createOAuthEndpoints(HOSTS, hanging, 10)

    const error = await endpoints.refresh({clientId: 'oc-1', refreshToken: 'r'}).catch((e) => e)

    expect(error).toBeInstanceOf(OAuthRequestTimeoutError)
    expect(error).not.toBeInstanceOf(OAuthRequestError)
  })
})
