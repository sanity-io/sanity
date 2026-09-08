import {type SanityClient} from '@sanity/client'
import {describe, expect, test} from 'vitest'

import {memoizeKeyGen} from './memoizeKeyGen'

function createClient(config: {token?: string; projectId?: string; dataset?: string}) {
  return {config: () => ({projectId: 'p', dataset: 'd', ...config})} as unknown as SanityClient
}

const idPair = {publishedId: 'doc', draftId: 'drafts.doc'}

describe('memoizeKeyGen', () => {
  test('clients with the same token share a key', () => {
    const a = createClient({token: 'token-1'})
    const b = createClient({token: 'token-1'})
    expect(memoizeKeyGen(a, idPair, 'type')).toBe(memoizeKeyGen(b, idPair, 'type'))
  })

  test('a client with a different token gets a different key', () => {
    const before = createClient({token: 'token-1'})
    const after = createClient({token: 'token-2'})
    expect(memoizeKeyGen(before, idPair, 'type')).not.toBe(memoizeKeyGen(after, idPair, 'type'))
  })

  test('cookie clients (no token) share a key', () => {
    expect(memoizeKeyGen(createClient({}), idPair, 'type')).toBe(
      memoizeKeyGen(createClient({}), idPair, 'type'),
    )
  })

  test('the key does not contain the token', () => {
    expect(memoizeKeyGen(createClient({token: 'sk-secret'}), idPair, 'type')).not.toContain(
      'sk-secret',
    )
  })

  test('the key still distinguishes project, dataset, document and version', () => {
    const client = createClient({token: 'token-1'})
    const keys = [
      memoizeKeyGen(client, idPair, 'type'),
      memoizeKeyGen(client, idPair, 'other'),
      memoizeKeyGen(client, {...idPair, versionId: 'versions.r1.doc'}, 'type'),
      memoizeKeyGen(client, {publishedId: 'doc2', draftId: 'drafts.doc2'}, 'type'),
      memoizeKeyGen(createClient({token: 'token-1', dataset: 'd2'}), idPair, 'type'),
      memoizeKeyGen(createClient({token: 'token-1', projectId: 'p2'}), idPair, 'type'),
    ]
    expect(new Set(keys).size).toBe(keys.length)
  })
})
