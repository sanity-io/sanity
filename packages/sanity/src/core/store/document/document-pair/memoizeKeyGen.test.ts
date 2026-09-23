import {type SanityClient} from '@sanity/client'
import {describe, expect, test} from 'vitest'

import {memoizeKeyGen} from './memoizeKeyGen'

function createClient(config: {token?: string; projectId?: string; dataset?: string} = {}) {
  return {config: () => ({projectId: 'p', dataset: 'd', ...config})} as unknown as SanityClient
}

const idPair = {publishedId: 'doc', draftId: 'drafts.doc'}

describe('memoizeKeyGen', () => {
  test('clients with the same token share a key (so sibling clients reuse one pair)', () => {
    const a = createClient({token: 'token-1'})
    const b = createClient({token: 'token-1'})
    expect(memoizeKeyGen(a, idPair, 'type')).toBe(memoizeKeyGen(b, idPair, 'type'))
  })

  test('a new token yields a different key (re-auth gets a fresh pair)', () => {
    const before = createClient({token: 'token-OLD'})
    const after = createClient({token: 'token-NEW'})
    expect(memoizeKeyGen(before, idPair, 'type')).not.toBe(memoizeKeyGen(after, idPair, 'type'))
  })

  test('cookie clients (no token) share a key', () => {
    expect(memoizeKeyGen(createClient(), idPair, 'type')).toBe(
      memoizeKeyGen(createClient(), idPair, 'type'),
    )
  })

  test('still distinguishes project, dataset, document, version and type', () => {
    const client = createClient({token: 't'})
    const keys = [
      memoizeKeyGen(client, idPair, 'type'),
      memoizeKeyGen(client, idPair, 'other'),
      memoizeKeyGen(client, {...idPair, versionId: 'versions.r1.doc'}, 'type'),
      memoizeKeyGen(client, {publishedId: 'doc2', draftId: 'drafts.doc2'}, 'type'),
      memoizeKeyGen(createClient({token: 't', dataset: 'd2'}), idPair, 'type'),
      memoizeKeyGen(createClient({token: 't', projectId: 'p2'}), idPair, 'type'),
    ]
    expect(new Set(keys).size).toBe(keys.length)
  })
})
