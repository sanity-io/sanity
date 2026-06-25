import {firstValueFrom, from, toArray} from 'rxjs'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {type Message, type ProxyRequest, type ProxyResponse} from './proxy'
import {
  dropMutations,
  duplicateMutations,
  expiredToken,
  randomLatency,
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

function fakeReq(method: string, origin?: string): ProxyRequest {
  return {method, headers: origin ? {origin} : {}} as unknown as ProxyRequest
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

    handler(fakeReq('OPTIONS', 'https://app.localhost'), fakeRes().res, target)
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
