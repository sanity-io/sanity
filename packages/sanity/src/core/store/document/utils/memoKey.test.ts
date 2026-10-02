import {createClient, type SanityClient} from '@sanity/client'
import {type Observable, of} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {createMemoKey, getClientCredentialSegments} from './memoKey'

const client = (config: {token?: string; dataset?: string; projectId?: string}) =>
  ({config: () => config}) as unknown as SanityClient

describe('createMemoKey', () => {
  it('does not collide when a segment contains the values of adjacent segments', () => {
    // A plain `-` join would make both of these `a-b-c`.
    expect(createMemoKey(['a-b', 'c'])).not.toBe(createMemoKey(['a', 'b-c']))
  })

  it('does not collide when a dash-bearing dataset abuts another segment', () => {
    // `test-dataset` + `ppsg` vs `test` + `dataset-ppsg`.
    expect(createMemoKey(['', 'test-dataset', 'ppsg'])).not.toBe(
      createMemoKey(['', 'test', 'dataset-ppsg']),
    )
  })

  it('is stable for equal segment lists', () => {
    expect(createMemoKey(['t', 'd', 'p'])).toBe(createMemoKey(['t', 'd', 'p']))
  })

  it('treats undefined as an empty segment', () => {
    expect(createMemoKey(['t', undefined, 'p'])).toBe(createMemoKey(['t', '', 'p']))
  })
})

describe('getClientCredentialSegments with a reactive credential', () => {
  // Under a reactive `auth`, `config().token` is the last credential the client resolved and
  // changes on every rotation. Keying caches on it rebuilds every document pair per rotation:
  // two listeners for the same document for a few seconds, and an in-flight commit of the old
  // pair aborted. The credential *source* is what identifies the session: `config().auth` is
  // carried by reference through `withConfig`, and the OAuth store makes a new one per sign-in.
  const clientWith = (config: {auth?: Observable<unknown>; token?: string}) =>
    ({config: () => ({...config, dataset: 'd', projectId: 'p'})}) as unknown as SanityClient

  it('keys on the credential source, not on the token it last resolved', () => {
    const auth = of({token: 'access-1'})
    expect(getClientCredentialSegments(clientWith({auth, token: 'access-1'}))).toEqual(
      getClientCredentialSegments(clientWith({auth, token: 'access-2'})),
    )
  })

  it('tells two credential sources apart even when they resolved the same token', () => {
    expect(
      getClientCredentialSegments(clientWith({auth: of({token: 'access-1'}), token: 'access-1'})),
    ).not.toEqual(
      getClientCredentialSegments(clientWith({auth: of({token: 'access-1'}), token: 'access-1'})),
    )
  })

  it('falls back to the token for a client without a credential source', () => {
    expect(getClientCredentialSegments(clientWith({token: 'sk'}))).toEqual(['sk', 'd', 'p'])
  })
})

describe('getClientCredentialSegments with a real client', () => {
  // `@sanity/client` exposes `config().auth` for every client, static ones included. A static
  // credential must still key on its value: two clients created with the same token (or two
  // cookie clients) share caches, as they did before the client had `auth`.
  const base = {
    projectId: 'abc12345',
    dataset: 'd',
    apiVersion: '2025-01-01',
    useCdn: false,
    ignoreBrowserTokenWarning: true,
  }

  it('keys two static clients with the same token alike', () => {
    expect(getClientCredentialSegments(createClient({...base, token: 'sk-1'}))).toEqual(
      getClientCredentialSegments(createClient({...base, token: 'sk-1'})),
    )
    expect(getClientCredentialSegments(createClient({...base, token: 'sk-1'}))).toEqual([
      'sk-1',
      'd',
      'abc12345',
    ])
  })

  it('keys two cookie clients alike', () => {
    expect(getClientCredentialSegments(createClient({...base, withCredentials: true}))).toEqual(
      getClientCredentialSegments(createClient({...base, withCredentials: true})),
    )
  })

  it('keys a reactive client on its credential source, shared through withConfig', () => {
    const auth = of(Promise.resolve({token: 'sk-1'}))
    const reactive = createClient({...base, auth})
    expect(getClientCredentialSegments(reactive)).toEqual(
      getClientCredentialSegments(reactive.withConfig({apiVersion: '2025-02-02'})),
    )
    expect(getClientCredentialSegments(reactive)).not.toEqual(
      getClientCredentialSegments(
        createClient({...base, auth: of(Promise.resolve({token: 'sk-1'}))}),
      ),
    )
    // Not the token: a static client with the same value is a different source.
    expect(getClientCredentialSegments(reactive)).not.toEqual(
      getClientCredentialSegments(createClient({...base, token: 'sk-1'})),
    )
  })
})

describe('getClientCredentialSegments', () => {
  it('returns [token, dataset, projectId], defaulting missing values to empty strings', () => {
    expect(
      getClientCredentialSegments(client({token: 'sk', dataset: 'd', projectId: 'p'})),
    ).toEqual(['sk', 'd', 'p'])
    expect(getClientCredentialSegments(client({dataset: 'd', projectId: 'p'}))).toEqual([
      '',
      'd',
      'p',
    ])
  })

  it('changes the credential key when only the token differs', () => {
    const a = createMemoKey(
      getClientCredentialSegments(client({token: 'old', dataset: 'd', projectId: 'p'})),
    )
    const b = createMemoKey(
      getClientCredentialSegments(client({token: 'new', dataset: 'd', projectId: 'p'})),
    )
    expect(a).not.toBe(b)
  })
})
