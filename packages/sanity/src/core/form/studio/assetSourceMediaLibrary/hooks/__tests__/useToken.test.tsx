import {type AuthState, createClient, type SanityClient} from '@sanity/client'
import {renderHook, waitFor} from '@testing-library/react'
import {BehaviorSubject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useToken} from '../useToken'

const mocks = vi.hoisted(() => ({client: undefined as SanityClient | undefined}))

vi.mock('../../../../../hooks/useClient', () => ({useClient: () => mocks.client}))

const base = {
  projectId: 'abc12345',
  dataset: 'd',
  apiVersion: '2025-01-01',
  useCdn: false,
  ignoreBrowserTokenWarning: true,
}

function useThisClient(client: SanityClient) {
  mocks.client = client
}

describe('useToken', () => {
  beforeEach(() => {
    mocks.client = undefined
  })

  it('returns the static token', () => {
    useThisClient(createClient({...base, token: 'sk-static'}))
    const {result} = renderHook(() => useToken())
    expect(result.current).toBe('sk-static')
  })

  it('follows a reactive credential through a rotation', async () => {
    // Under a reactive `auth`, `config().token` is the token last resolved by a request:
    // `undefined` before the first one, stale after a rotation. The hook must read the
    // credential source instead, and update when it rotates: the media library plugin asks
    // for the token through postMessage and image fetches carry it as a bearer.
    const auth = new BehaviorSubject<Promise<AuthState>>(Promise.resolve({token: 'access-1'}))
    useThisClient(createClient({...base, auth}))

    const {result} = renderHook(() => useToken())
    await waitFor(() => expect(result.current).toBe('access-1'))

    auth.next(Promise.resolve({token: 'access-2'}))
    await waitFor(() => expect(result.current).toBe('access-2'))
  })

  it('is undefined for a cookie-authenticated client', async () => {
    useThisClient(createClient({...base, withCredentials: true}))
    const {result} = renderHook(() => useToken())
    await waitFor(() => expect(result.current).toBeUndefined())
  })
})
