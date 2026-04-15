import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it, vi} from 'vitest'

import {
  discardMatchingDrafts,
  discardMatchingDraftsForRelease,
  documentsContentMatch,
} from '../discardMatchingDrafts'

describe('documentsContentMatch', () => {
  it('returns true when documents have matching content (ignoring system fields)', () => {
    const draft = {_id: 'drafts.doc1', _rev: 'rev-a', _type: 'article', title: 'Hello'}
    const published = {_id: 'doc1', _rev: 'rev-b', _type: 'article', title: 'Hello'}
    expect(documentsContentMatch(draft, published)).toBe(true)
  })

  it('returns false when documents have different content', () => {
    const draft = {_id: 'drafts.doc1', _rev: 'rev-a', _type: 'article', title: 'Draft'}
    const published = {_id: 'doc1', _rev: 'rev-b', _type: 'article', title: 'Published'}
    expect(documentsContentMatch(draft, published)).toBe(false)
  })

  it('returns false when documents have different number of fields', () => {
    const draft = {_id: 'drafts.doc1', _rev: 'rev-a', _type: 'article', title: 'Hello', extra: 1}
    const published = {_id: 'doc1', _rev: 'rev-b', _type: 'article', title: 'Hello'}
    expect(documentsContentMatch(draft, published)).toBe(false)
  })

  it('ignores _updatedAt and _createdAt differences', () => {
    const draft = {
      _id: 'drafts.doc1',
      _rev: 'rev-a',
      _createdAt: '2024-01-01',
      _updatedAt: '2024-01-02',
      _type: 'article',
      title: 'Hello',
    }
    const published = {
      _id: 'doc1',
      _rev: 'rev-b',
      _createdAt: '2024-01-03',
      _updatedAt: '2024-01-04',
      _type: 'article',
      title: 'Hello',
    }
    expect(documentsContentMatch(draft, published)).toBe(true)
  })

  it('handles nested objects and arrays', () => {
    const draft = {
      _id: 'drafts.doc1',
      _rev: 'rev-a',
      _type: 'article',
      body: [{_type: 'block', children: [{text: 'Hello'}]}],
    }
    const published = {
      _id: 'doc1',
      _rev: 'rev-b',
      _type: 'article',
      body: [{_type: 'block', children: [{text: 'Hello'}]}],
    }
    expect(documentsContentMatch(draft, published)).toBe(true)
  })

  it('matches regardless of key order', () => {
    const draft = {_id: 'drafts.doc1', _rev: 'rev-a', title: 'Hello', _type: 'article'}
    const published = {_id: 'doc1', _rev: 'rev-b', _type: 'article', title: 'Hello'}
    expect(documentsContentMatch(draft, published)).toBe(true)
  })
})

describe('discardMatchingDrafts', () => {
  const createMockClient = () => {
    const mockTx = {
      delete: vi.fn().mockReturnThis(),
      commit: vi.fn().mockResolvedValue(undefined),
    }
    return {
      client: {
        getDocument: vi.fn().mockResolvedValue(null),
        transaction: vi.fn().mockReturnValue(mockTx),
      } as any,
      mockTx,
    }
  }

  it('does nothing for empty published IDs', async () => {
    const {client} = createMockClient()
    await discardMatchingDrafts(client, [])
    expect(client.getDocument).not.toHaveBeenCalled()
  })

  it('deletes drafts that match published versions', async () => {
    const {client, mockTx} = createMockClient()
    const sharedContent = {_type: 'article', title: 'Hello'}

    client.getDocument
      .mockResolvedValueOnce({_id: 'drafts.doc1', _rev: 'rev-1', ...sharedContent})
      .mockResolvedValueOnce({_id: 'doc1', _rev: 'rev-2', ...sharedContent})

    await discardMatchingDrafts(client, ['doc1'])

    expect(mockTx.delete).toHaveBeenCalledWith('drafts.doc1')
    expect(mockTx.commit).toHaveBeenCalledWith({tag: 'release.post-publish-draft-cleanup'})
  })

  it('does not delete drafts that differ from published', async () => {
    const {client, mockTx} = createMockClient()

    client.getDocument
      .mockResolvedValueOnce({_id: 'drafts.doc1', _rev: 'rev-1', _type: 'article', title: 'Draft'})
      .mockResolvedValueOnce({
        _id: 'doc1',
        _rev: 'rev-2',
        _type: 'article',
        title: 'Published',
      })

    await discardMatchingDrafts(client, ['doc1'])

    expect(mockTx.delete).not.toHaveBeenCalled()
    expect(mockTx.commit).not.toHaveBeenCalled()
  })

  it('does not delete when draft does not exist', async () => {
    const {client, mockTx} = createMockClient()

    client.getDocument
      .mockResolvedValueOnce(null) // no draft
      .mockResolvedValueOnce({_id: 'doc1', _rev: 'rev-2', _type: 'article', title: 'Published'})

    await discardMatchingDrafts(client, ['doc1'])

    expect(mockTx.delete).not.toHaveBeenCalled()
  })

  it('handles multiple documents, only deleting matching drafts', async () => {
    const {client, mockTx} = createMockClient()

    // doc1: draft matches published
    client.getDocument
      .mockResolvedValueOnce({_id: 'drafts.doc1', _rev: 'rev-1', _type: 'article', title: 'Same'})
      .mockResolvedValueOnce({_id: 'doc1', _rev: 'rev-2', _type: 'article', title: 'Same'})
      // doc2: draft differs from published
      .mockResolvedValueOnce({
        _id: 'drafts.doc2',
        _rev: 'rev-3',
        _type: 'article',
        title: 'Different',
      })
      .mockResolvedValueOnce({
        _id: 'doc2',
        _rev: 'rev-4',
        _type: 'article',
        title: 'Published',
      })

    await discardMatchingDrafts(client, ['doc1', 'doc2'])

    expect(mockTx.delete).toHaveBeenCalledWith('drafts.doc1')
    expect(mockTx.delete).not.toHaveBeenCalledWith('drafts.doc2')
    expect(mockTx.delete).toHaveBeenCalledTimes(1)
  })
})

describe('discardMatchingDraftsForRelease', () => {
  const createMockClient = () => {
    const mockTx = {
      delete: vi.fn().mockReturnThis(),
      commit: vi.fn().mockResolvedValue(undefined),
    }
    return {
      client: {
        fetch: vi.fn().mockResolvedValue([]),
        getDocument: vi.fn().mockResolvedValue(null),
        transaction: vi.fn().mockReturnValue(mockTx),
      } as any,
      mockTx,
    }
  }

  it('uses finalDocumentStates when available', async () => {
    const {client, mockTx} = createMockClient()
    const sharedContent = {_type: 'article', title: 'Hello'}

    client.getDocument
      .mockResolvedValueOnce({_id: 'drafts.doc1', _rev: 'rev-1', ...sharedContent})
      .mockResolvedValueOnce({_id: 'doc1', _rev: 'rev-2', ...sharedContent})

    const release = {
      _id: '_.releases.rTest',
      state: 'published',
      finalDocumentStates: [{id: 'doc1'}],
    } as unknown as ReleaseDocument

    await discardMatchingDraftsForRelease(client, release)

    // Should NOT call fetch because finalDocumentStates is available
    expect(client.fetch).not.toHaveBeenCalled()
    expect(mockTx.delete).toHaveBeenCalledWith('drafts.doc1')
  })

  it('queries for documents when finalDocumentStates is not available', async () => {
    const {client, mockTx} = createMockClient()
    const sharedContent = {_type: 'article', title: 'Hello'}

    client.fetch.mockResolvedValueOnce(['versions.rTest.doc1'])
    client.getDocument
      .mockResolvedValueOnce({_id: 'drafts.doc1', _rev: 'rev-1', ...sharedContent})
      .mockResolvedValueOnce({_id: 'doc1', _rev: 'rev-2', ...sharedContent})

    const release = {
      _id: '_.releases.rTest',
      state: 'published',
      finalDocumentStates: null,
    } as unknown as ReleaseDocument

    await discardMatchingDraftsForRelease(client, release)

    expect(client.fetch).toHaveBeenCalledWith(
      expect.stringContaining('partOfRelease'),
      {releaseId: 'rTest'},
      expect.objectContaining({tag: 'release.post-publish-draft-cleanup'}),
    )
    expect(mockTx.delete).toHaveBeenCalledWith('drafts.doc1')
  })
})
