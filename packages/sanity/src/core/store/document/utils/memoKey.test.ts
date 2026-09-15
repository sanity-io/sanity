import {type SanityClient} from '@sanity/client'
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
