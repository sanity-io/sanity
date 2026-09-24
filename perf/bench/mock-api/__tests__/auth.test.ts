// @vitest-environment node
import {describe, expect, it} from 'vitest'

import {BENCH_USER, FAKE_SESSION_ID, FAKE_TOKEN} from '../../constants'
import {type AuthRequest, handleAuth} from '../auth'

function request(overrides: Partial<AuthRequest>): AuthRequest {
  return {
    method: 'GET',
    path: '/users/me',
    query: new URLSearchParams(),
    authorization: undefined,
    requireToken: false,
    hasSession: false,
    ...overrides,
  }
}

describe('handleAuth', () => {
  it('signs in every request by default, with or without credentials', () => {
    expect(handleAuth(request({}))).toEqual({status: 200, body: BENCH_USER})
    expect(handleAuth(request({path: '/auth/id'}))?.status).toBe(200)
  })

  it('answers logged out to credential-less requests when a token is required', () => {
    expect(handleAuth(request({requireToken: true}))).toEqual({status: 200, body: {}})
    expect(handleAuth(request({path: '/auth/id', requireToken: true}))?.status).toBe(401)
  })

  it('signs in token-carrying requests when a token is required', () => {
    const authorization = `Bearer ${FAKE_TOKEN}`
    expect(handleAuth(request({requireToken: true, authorization}))).toEqual({
      status: 200,
      body: BENCH_USER,
    })
    expect(handleAuth(request({requireToken: true, authorization: 'Bearer other'}))?.body).toEqual(
      {},
    )
  })

  it('signs in credential-less requests once a session exists (the login cookie)', () => {
    expect(
      handleAuth(request({path: '/auth/id', requireToken: true, hasSession: true}))?.status,
    ).toBe(200)
    expect(handleAuth(request({requireToken: true, hasSession: true}))?.body).toEqual(BENCH_USER)
  })

  it('exchanges only the fake session id for the token', () => {
    expect(
      handleAuth(
        request({path: '/auth/fetch', query: new URLSearchParams({sid: FAKE_SESSION_ID})}),
      ),
    ).toEqual({status: 200, body: {token: FAKE_TOKEN}, startsSession: true})
    expect(
      handleAuth(request({path: '/auth/fetch', query: new URLSearchParams({sid: 'nope'})}))?.status,
    ).toBe(401)
  })

  it('leaves non-auth paths (including keyvalue) to the caller', () => {
    expect(handleAuth(request({path: '/users/me/keyvalue/a'}))).toBeUndefined()
    expect(handleAuth(request({path: '/projects/x'}))).toBeUndefined()
  })
})
