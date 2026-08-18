import {describe, expect, it} from 'vitest'

import {resolveEventsRevisionId} from './resolveEventsRevisionId'
import {
  type DeleteDocumentVersionEvent,
  type EditDocumentVersionEvent,
  type PublishDocumentVersionEvent,
} from './types'

function noopLoadMore() {}

const publishEvent: PublishDocumentVersionEvent = {
  type: 'publishDocumentVersion',
  id: 'publish-event-id',
  timestamp: '2026-01-01T00:00:00.000Z',
  author: 'author-1',
  documentVariantType: 'draft',
  documentId: 'doc-1',
  revisionId: 'publish-revision-id',
  versionId: 'drafts.doc-1',
  publishCause: 'document.publish',
}

const editEvent: EditDocumentVersionEvent = {
  type: 'editDocumentVersion',
  id: 'edit-event-id',
  timestamp: '2026-01-02T00:00:00.000Z',
  author: 'author-1',
  documentVariantType: 'draft',
  documentId: 'drafts.doc-1',
  contributors: ['author-1'],
  revisionId: 'edit-revision-id',
  transactions: [],
}

const discardEvent: DeleteDocumentVersionEvent = {
  type: 'deleteDocumentVersion',
  id: 'discard-event-id',
  timestamp: '2026-01-03T00:00:00.000Z',
  author: 'author-1',
  documentVariantType: 'draft',
  documentId: 'doc-1',
  versionId: 'drafts.doc-1',
  versionRevisionId: 'discard-version-revision-id',
}

const releasePublishEvent: PublishDocumentVersionEvent = {
  ...publishEvent,
  id: 'release-publish-event-id',
  releaseId: 'rel-1',
}

describe('resolveEventsRevisionId()', () => {
  it('returns the publish event id when rev is unset and the latest event is a publish', () => {
    const result = resolveEventsRevisionId({
      events: [publishEvent, editEvent],
      loading: false,
      loadMore: noopLoadMore,
    })
    expect(result).toBe('publish-event-id')
  })

  it('returns null when rev is unset and the latest event is a discard', () => {
    const result = resolveEventsRevisionId({
      events: [discardEvent, editEvent, publishEvent],
      loading: false,
      loadMore: noopLoadMore,
    })
    expect(result).toBeNull()
    expect(result).not.toBe('edit-revision-id')
  })

  it('returns null when rev is unset, the latest event is a discard, and there is no publish event', () => {
    const result = resolveEventsRevisionId({
      events: [discardEvent, editEvent],
      loading: false,
      loadMore: noopLoadMore,
    })
    expect(result).toBeNull()
  })

  it('returns the given event id when rev is set', () => {
    const result = resolveEventsRevisionId({
      rev: 'edit-event-id',
      events: [editEvent, publishEvent],
      loading: false,
      loadMore: noopLoadMore,
    })
    expect(result).toBe('edit-event-id')
  })

  it('returns the publish event id when rev is @lastPublished', () => {
    const result = resolveEventsRevisionId({
      rev: '@lastPublished',
      events: [editEvent, publishEvent],
      loading: false,
      loadMore: noopLoadMore,
    })
    expect(result).toBe('publish-event-id')
  })

  it('returns the edit event revisionId when rev is @lastEdited', () => {
    const result = resolveEventsRevisionId({
      rev: '@lastEdited',
      events: [publishEvent, editEvent],
      loading: false,
      loadMore: noopLoadMore,
    })
    expect(result).toBe('edit-revision-id')
  })

  it('returns the matching publish event id when rev is a release token', () => {
    const result = resolveEventsRevisionId({
      rev: '@release:rel-1',
      events: [editEvent, releasePublishEvent, publishEvent],
      loading: false,
      loadMore: noopLoadMore,
    })
    expect(result).toBe('release-publish-event-id')
  })

  it('calls loadMore and returns the release token when the release publish event is missing', () => {
    const calls: string[] = []
    const result = resolveEventsRevisionId({
      rev: '@release:rel-1',
      events: [publishEvent],
      loading: false,
      loadMore: () => {
        calls.push('loadMore')
      },
    })
    expect(calls).toEqual(['loadMore'])
    expect(result).toBe('@release:rel-1')
  })
})
