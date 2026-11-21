import {describe, expect, it} from 'vitest'

import {
  deltaOperation,
  evaluateDelta,
  type HistoryClient,
  loadRevision,
  loadRevisions,
} from './deltaQuery'

const before = {_id: 'a', _type: 'post', title: 'Old', slug: {current: 'old'}}
const after = {_id: 'a', _type: 'post', title: 'New', slug: {current: 'old'}}

function run(query: string, documents: {before: unknown; after: unknown}, params = {}) {
  return evaluateDelta({query, params, ...documents})
}

describe('evaluateDelta', () => {
  it('evaluates a webhook filter with @ as the document after the change', async () => {
    expect(await run('_type == "post" && delta::changedAny(title)', {before, after})).toBe(true)
    expect(await run('_type == "post" && delta::changedAny(slug)', {before, after})).toBe(false)
    expect(await run('delta::changedOnly(title)', {before, after})).toBe(true)
  })

  it('projects before() and after(), and tells creates, updates and deletes', async () => {
    expect(
      await run('{"was": before().title, "is": after().title, "op": delta::operation()}', {
        before,
        after,
      }),
    ).toEqual({was: 'Old', is: 'New', op: 'update'})
    expect(await run('delta::operation()', {before: null, after})).toBe('create')
    // A delete reads the document as it was
    expect(await run('{"op": delta::operation(), title}', {before, after: null})).toEqual({
      op: 'delete',
      title: 'Old',
    })
  })

  it('takes params, and fails on a query that does not parse', async () => {
    expect(await run('title == $title', {before, after}, {title: 'New'})).toBe(true)
    await expect(run('delta::changedAny(', {before, after})).rejects.toThrow()
  })
})

describe('deltaOperation', () => {
  it('follows from which document is missing', () => {
    expect(deltaOperation(null, after)).toBe('create')
    expect(deltaOperation(before, after)).toBe('update')
    expect(deltaOperation(before, null)).toBe('delete')
    expect(deltaOperation(null, null)).toBeNull()
  })
})

describe('document history', () => {
  function clientAnswering(body: unknown) {
    const urls: string[] = []
    const client: HistoryClient = {
      getDataUrl: (operation, path) => `/data/${operation}/test/${path}`,
      request: ({url}) => {
        urls.push(url)
        return Promise.resolve(body)
      },
    }
    return {client, urls}
  }

  it('lists revisions from the NDJSON transactions, newest first', async () => {
    const {client, urls} = clientAnswering(
      [
        '{"id":"r2","timestamp":"2026-10-15T10:00:00Z","author":"p1","mutations":[]}',
        '{"id":"r1","timestamp":"2026-10-14T10:00:00Z","author":"p2","mutations":[]}',
        '',
      ].join('\n'),
    )
    expect(await loadRevisions(client, 'drafts.a')).toEqual([
      {id: 'r2', timestamp: '2026-10-15T10:00:00Z', author: 'p1'},
      {id: 'r1', timestamp: '2026-10-14T10:00:00Z', author: 'p2'},
    ])
    expect(urls).toEqual([
      '/data/history/test/transactions/drafts.a?excludeContent=true&reverse=true&limit=20',
    ])
  })

  it('loads the document at a revision, or null when it did not exist then', async () => {
    expect(await loadRevision(clientAnswering({documents: [before]}).client, 'a', 'r1')).toEqual(
      before,
    )
    const {client, urls} = clientAnswering({documents: []})
    expect(await loadRevision(client, 'a', 'r 0')).toBeNull()
    expect(urls).toEqual(['/data/history/test/documents/a?revision=r%200'])
  })
})
