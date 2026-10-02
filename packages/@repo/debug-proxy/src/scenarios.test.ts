import {firstValueFrom, from, toArray} from 'rxjs'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {type Message, type ProxyRequest, type ProxyResponse} from './proxy'
import {
  dropMutations,
  duplicateMutations,
  expiredToken,
  invalidSession,
  randomLatency,
  refusedRefreshToken,
  sendReset,
} from './scenarios'

function mutation(id: string): Message {
  return {type: 'message', message: {event: 'mutation', id, data: '{}'}}
}

function welcome(): Message {
  return {type: 'message', message: {event: 'welcome', data: '{}'}}
}

describe('dropMutations', () => {
  test('drops every mutation at probability 1, keeps non-mutations', async () => {
    const input = [welcome(), mutation('a'), mutation('b')]
    const out = await firstValueFrom(from(input).pipe(dropMutations(1), toArray()))
    expect(out).toEqual([welcome()])
  })

  test('drops nothing at probability 0', async () => {
    const input = [welcome(), mutation('a'), mutation('b')]
    const out = await firstValueFrom(from(input).pipe(dropMutations(0), toArray()))
    expect(out).toEqual(input)
  })
})

describe('duplicateMutations', () => {
  test('duplicates every mutation at probability 1, leaves others alone', async () => {
    const input = [welcome(), mutation('a')]
    const out = await firstValueFrom(from(input).pipe(duplicateMutations(1), toArray()))
    expect(out).toEqual([welcome(), mutation('a'), mutation('a')])
  })
})

describe('sendReset', () => {
  test('rewrites mutations to reset events at probability 1', async () => {
    const input = [welcome(), mutation('a')]
    const out = (await firstValueFrom(from(input).pipe(sendReset(1), toArray()))) as Message[]
    expect(out[0]).toEqual(welcome())
    expect(out[1]?.message.event).toBe('reset')
    // preserves the original event id
    expect(out[1]?.message.id).toBe('a')
  })
})

type FakeRes = {head?: {status: number; headers: Record<string, unknown>}; body?: string}

function fakeReq(method: string, url = '/v1/users/me', origin?: string): ProxyRequest {
  return {method, url, headers: origin ? {origin} : {}} as unknown as ProxyRequest
}

function fakeRes(): {res: ProxyResponse; captured: FakeRes} {
  const captured: FakeRes = {}
  const res = {
    writeHead: (status: number, _statusText: string, headers: Record<string, unknown>) => {
      captured.head = {status, headers}
    },
    end: (body?: string) => {
      captured.body = body
    },
  }
  return {res: res as unknown as ProxyResponse, captured}
}

describe('invalidSession', () => {
  const target = {url: new URL('https://example.localhost/v1/users/me')}

  test('answers with the session-not-found 401 (SIO-401-ANF) when so configured', () => {
    let forwarded = false
    const handler = invalidSession(
      () => {
        forwarded = true
        return {unsubscribe: () => {}} as never
      },
      () => true,
      {errorCode: 'SIO-401-ANF'},
    )

    const {res, captured} = fakeRes()
    handler(fakeReq('GET'), res, target)

    expect(forwarded).toBe(false)
    expect(captured.head?.status).toBe(401)
    // The exact body the API returns for a token resolving to no session
    expect(JSON.parse(captured.body ?? '{}')).toEqual({
      error: 'Unauthorized',
      statusCode: 401,
      message: 'Session not found',
      errorCode: 'SIO-401-ANF',
    })
  })

  test('defaults to the expired-session 401 (SIO-401-AEX)', () => {
    const handler = invalidSession(
      () => ({unsubscribe: () => {}}) as never,
      () => true,
    )

    const {res, captured} = fakeRes()
    handler(fakeReq('GET'), res, target)

    expect(captured.head?.status).toBe(401)
    expect(JSON.parse(captured.body ?? '{}')).toMatchObject({errorCode: 'SIO-401-AEX'})
  })

  test('answers with an RFC 6750 bearer challenge, without a Sanity error code, when so configured', () => {
    const handler = invalidSession(
      () => ({unsubscribe: () => {}}) as never,
      () => true,
      {errorCode: 'invalid_token'},
    )

    const {res, captured} = fakeRes()
    handler(fakeReq('GET'), res, target)

    expect(captured.head?.status).toBe(401)
    expect(captured.head?.headers['www-authenticate']).toBe('Bearer error="invalid_token"')
    const body = JSON.parse(captured.body ?? '{}')
    expect(body).toMatchObject({error: 'invalid_token'})
    expect(body).not.toHaveProperty('errorCode')
  })

  test('forwards the OAuth endpoints while invalid, and re-arms on a token endpoint request', () => {
    // An OAuth studio renews through /auth/oauth/token with its refresh token, never
    // with the access token the scenario invalidates. Answering the token endpoint with
    // a 401 would keep it from renewing at all, and its revoke calls on sign-out
    // would fail too.
    let forwarded: string[] = []
    let reauthenticated = 0
    const handler = invalidSession(
      (req) => {
        forwarded.push(req.url ?? '')
        return {unsubscribe: () => {}} as never
      },
      () => true,
      {onReauthenticated: () => (reauthenticated += 1)},
    )

    handler(fakeReq('GET', '/v1/auth/oauth/authorize?client_id=x'), fakeRes().res, target)
    handler(fakeReq('POST', '/v1/auth/oauth/token'), fakeRes().res, target)
    handler(fakeReq('POST', '/v1/auth/oauth/revoke'), fakeRes().res, target)
    expect(forwarded).toEqual([
      '/v1/auth/oauth/authorize?client_id=x',
      '/v1/auth/oauth/token',
      '/v1/auth/oauth/revoke',
    ])
    expect(reauthenticated).toBe(1)

    forwarded = []
    const {res, captured} = fakeRes()
    handler(fakeReq('GET', '/v1/users/me'), res, target)
    expect(forwarded).toEqual([])
    expect(captured.head?.status).toBe(401)
  })
})

describe('refusedRefreshToken', () => {
  const target = {url: new URL('https://example.localhost/v1/auth/oauth/token')}

  test('answers a POST to the OAuth token endpoint with invalid_grant once refused', () => {
    let forwarded = false
    const handler = refusedRefreshToken(
      () => {
        forwarded = true
        return {unsubscribe: () => {}} as never
      },
      () => true,
    )

    const {res, captured} = fakeRes()
    handler(fakeReq('POST', '/v1/auth/oauth/token'), res, target)

    expect(forwarded).toBe(false)
    expect(captured.head?.status).toBe(400)
    expect(captured.head?.headers['cache-control']).toBe('no-store')
    expect(JSON.parse(captured.body ?? '{}')).toMatchObject({error: 'invalid_grant'})
  })

  test('forwards everything else: preflights, API requests, and the token endpoint before the deadline', () => {
    const forwarded: string[] = []
    let refused = false
    const handler = refusedRefreshToken(
      (req) => {
        forwarded.push(`${req.method} ${req.url}`)
        return {unsubscribe: () => {}} as never
      },
      () => refused,
    )

    handler(fakeReq('POST', '/v1/auth/oauth/token'), fakeRes().res, target)
    refused = true
    handler(fakeReq('OPTIONS', '/v1/auth/oauth/token'), fakeRes().res, target)
    handler(fakeReq('GET', '/v1/users/me'), fakeRes().res, target)
    handler(fakeReq('POST', '/v1/auth/oauth/revoke'), fakeRes().res, target)

    expect(forwarded).toEqual([
      'POST /v1/auth/oauth/token',
      'OPTIONS /v1/auth/oauth/token',
      'GET /v1/users/me',
      'POST /v1/auth/oauth/revoke',
    ])
  })
})

describe('expiredToken', () => {
  const target = {url: new URL('https://example.localhost/v1/users/me')}

  test('returns the expired-session 401 once expired, without calling upstream', () => {
    let forwarded = false
    const handler = expiredToken(
      () => {
        forwarded = true
        return {unsubscribe: () => {}} as never
      },
      () => true,
    )

    const {res, captured} = fakeRes()
    handler(fakeReq('GET'), res, target)

    expect(forwarded).toBe(false)
    expect(captured.head?.status).toBe(401)
    expect(JSON.parse(captured.body ?? '{}')).toMatchObject({
      statusCode: 401,
      errorCode: 'SIO-401-AEX',
    })
  })

  test('forwards to the wrapped handler while not yet expired', () => {
    let forwarded = false
    const handler = expiredToken(
      () => {
        forwarded = true
        return {unsubscribe: () => {}} as never
      },
      () => false,
    )

    handler(fakeReq('GET'), fakeRes().res, target)
    expect(forwarded).toBe(true)
  })

  test('always forwards CORS preflights so the browser can read the 401', () => {
    let forwarded = false
    const handler = expiredToken(
      () => {
        forwarded = true
        return {unsubscribe: () => {}} as never
      },
      () => true,
    )

    handler(fakeReq('OPTIONS', '/v1/users/me', 'https://app.localhost'), fakeRes().res, target)
    expect(forwarded).toBe(true)
  })

  test('answers logout with a 204 so the session can still be torn down', () => {
    let forwarded = false
    const handler = expiredToken(
      () => {
        forwarded = true
        return {unsubscribe: () => {}} as never
      },
      () => true,
    )

    const {res, captured} = fakeRes()
    handler(fakeReq('POST', '/vX/auth/logout'), res, target)

    expect(forwarded).toBe(false)
    expect(captured.head?.status).toBe(204)
    expect(captured.body).toBeUndefined()
  })

  test('never forwards logout upstream, even before expiry, so real credentials survive', () => {
    let forwarded = false
    const handler = expiredToken(
      () => {
        forwarded = true
        return {unsubscribe: () => {}} as never
      },
      () => false,
    )

    const {res, captured} = fakeRes()
    handler(fakeReq('POST', '/vX/auth/logout'), res, target)

    expect(forwarded).toBe(false)
    expect(captured.head?.status).toBe(204)
    expect(captured.body).toBeUndefined()
  })

  test('forwards /auth/fetch upstream even while expired, so re-login can succeed', () => {
    let forwarded = false
    const handler = expiredToken(
      () => {
        forwarded = true
        return {unsubscribe: () => {}} as never
      },
      () => true,
    )

    handler(fakeReq('GET', '/v1/auth/fetch?sid=abc'), fakeRes().res, target)
    expect(forwarded).toBe(true)
  })

  test('invokes onReauthenticated on a /auth/fetch token exchange', () => {
    let reauthenticated = 0
    const handler = expiredToken(
      () => ({unsubscribe: () => {}}) as never,
      () => true,
      {onReauthenticated: () => (reauthenticated += 1)},
    )

    handler(fakeReq('GET', '/v1/auth/fetch?sid=abc'), fakeRes().res, target)
    expect(reauthenticated).toBe(1)

    // a non-auth-fetch request must not re-arm the timer
    handler(fakeReq('GET', '/v1/users/me'), fakeRes().res, target)
    expect(reauthenticated).toBe(1)
  })

  test('forwards public auth endpoints (e.g. /auth/providers) instead of 401-ing', () => {
    let forwarded = false
    const handler = expiredToken(
      () => {
        forwarded = true
        return {unsubscribe: () => {}} as never
      },
      () => true,
    )

    handler(fakeReq('GET', '/v1/auth/providers'), fakeRes().res, target)
    expect(forwarded).toBe(true)
  })
})

describe('randomLatency', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('delays each event but emits all of them', async () => {
    const input = [mutation('a'), mutation('b'), mutation('c')]
    const promise = firstValueFrom(from(input).pipe(randomLatency(100, 200), toArray()))
    await vi.advanceTimersByTimeAsync(200)
    const out = (await promise) as Message[]
    expect(out).toHaveLength(3)
    expect(out.map((e) => e.message.id ?? '').sort((a, b) => a.localeCompare(b))).toEqual([
      'a',
      'b',
      'c',
    ])
  })
})
