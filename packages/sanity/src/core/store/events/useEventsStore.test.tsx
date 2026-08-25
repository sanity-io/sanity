import {type SanityClient} from '@sanity/client'
import {renderHook} from '@testing-library/react'
import {BehaviorSubject, type Observable, of, Subscription} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useSchema} from '../../hooks/useSchema'
import {
  createDocumentVersionEvent,
  deleteDocumentVersionEvent,
  editDocumentVersionEvent,
  minutesAfterBase,
  publishDocumentVersionEvent,
} from './__fixtures__/events.fixture'
import {createEventsStore} from './createEventsStore'
import {getDocumentAtRevision} from './getDocumentAtRevision'
import {type DocumentGroupEvent, type EventsStoreRevision} from './types'
import {type EventsObservableValue, useEventsStore} from './useEventsStore'

const {mockUseClient} = vi.hoisted(() => ({mockUseClient: vi.fn()}))

vi.mock('../../hooks/useClient', () => ({useClient: mockUseClient}))
vi.mock('../../hooks/useSchema', () => ({useSchema: vi.fn()}))
vi.mock('./createEventsStore', () => ({createEventsStore: vi.fn()}))
vi.mock('./getDocumentAtRevision', () => ({getDocumentAtRevision: vi.fn()}))

const mockUseSchema = vi.mocked(useSchema)
const mockCreateEventsStore = vi.mocked(createEventsStore)
const mockGetDocumentAtRevision = vi.mocked(getDocumentAtRevision)

const client = {config: () => ({dataset: 'test'})} as unknown as SanityClient

/**
 * Standard event list (newest first), ids double as revision ids:
 * - e0: edit        (40min)
 * - e1: publish     (30min, releaseId `rX`)
 * - e2: edit        (20min)
 * - e3: publish     (10min)
 * - e4: create      (0min)
 */
const editNewest = editDocumentVersionEvent({revisionId: 'e0', timestamp: minutesAfterBase(40)})
const publishNewest = publishDocumentVersionEvent({
  id: 'e1',
  revisionId: 'e1',
  releaseId: 'rX',
  timestamp: minutesAfterBase(30),
})
const editOlder = editDocumentVersionEvent({revisionId: 'e2', timestamp: minutesAfterBase(20)})
const publishOlder = publishDocumentVersionEvent({
  id: 'e3',
  revisionId: 'e3',
  timestamp: minutesAfterBase(10),
})
const created = createDocumentVersionEvent({id: 'e4', versionRevisionId: 'e4'})
const EVENTS = [editNewest, publishNewest, editOlder, publishOlder, created]

interface HookProps {
  documentId: string
  documentType: string
  rev?: string
  since?: string
}

function setup({
  events = EVENTS,
  loading = false,
  documentId = 'drafts.doc-1',
  rev,
  since,
}: {
  events?: DocumentGroupEvent[]
  loading?: boolean
  documentId?: string
  rev?: string
  since?: string
} = {}) {
  const events$ = new BehaviorSubject<EventsObservableValue>({
    events,
    nextCursor: '',
    loading,
    error: null,
  })
  const store = {
    eventsObservable$: events$,
    loadMoreEvents: vi.fn(),
    reloadEvents: vi.fn(),
    handleExpandEvent: vi.fn(),
    remoteTransactionsListener: vi.fn(() => new Subscription()),
    getDocumentChanges: vi.fn(() => of(null)),
  }
  mockCreateEventsStore.mockReturnValue(store as unknown as ReturnType<typeof createEventsStore>)

  const utils = renderHook((props: HookProps) => useEventsStore(props), {
    initialProps: {documentId, documentType: 'author', rev, since},
  })
  return {events$, store, ...utils}
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseClient.mockReturnValue(client)
  mockUseSchema.mockReturnValue({get: () => undefined} as unknown as ReturnType<typeof useSchema>)
  // Echo back the requested revision id so assertions can read result.current.revision.
  mockGetDocumentAtRevision.mockImplementation(
    ({revisionId}) =>
      of({document: null, loading: false, revisionId}) as Observable<EventsStoreRevision>,
  )
})

describe('useEventsStore', () => {
  describe('rev resolution', () => {
    it('@lastPublished resolves to the newest publish event', () => {
      const {result} = setup({rev: '@lastPublished'})
      expect(result.current.revision?.revisionId).toBe('e1')
    })

    it('@lastPublished with no publish events resolves to null (no revision fetched)', () => {
      const {result} = setup({rev: '@lastPublished', events: [editNewest, created]})
      expect(result.current.revision).toBeNull()
      expect(mockGetDocumentAtRevision).not.toHaveBeenCalledWith(
        expect.objectContaining({revisionId: '@lastPublished'}),
      )
    })

    it('@lastEdited resolves to the newest edit event revision', () => {
      const {result} = setup({rev: '@lastEdited'})
      expect(result.current.revision?.revisionId).toBe('e0')
    })

    it('@lastEdited with no edit events falls through to the literal string (known quirk)', () => {
      const {result} = setup({rev: '@lastEdited', events: [publishNewest, created]})
      expect(result.current.revision?.revisionId).toBe('@lastEdited')
      expect(mockGetDocumentAtRevision).toHaveBeenCalledWith(
        expect.objectContaining({revisionId: '@lastEdited'}),
      )
    })

    it('@release:<id> resolves to the publish event of that release', () => {
      const {result, store} = setup({rev: '@release:rX'})
      expect(result.current.revision?.revisionId).toBe('e1')
      expect(store.loadMoreEvents).not.toHaveBeenCalled()
    })

    it('@release:<id> unresolved keeps loading more events and leaks the raw string (known issue)', () => {
      const {result, store} = setup({rev: '@release:missing'})
      // While unresolved, resolveRevisionId keeps requesting the next events page.
      expect(store.loadMoreEvents).toHaveBeenCalled()
      // Bonus bug: while unresolved, the raw @release: string is used as the revision id.
      expect(result.current.revision?.revisionId).toBe('@release:missing')
      expect(mockGetDocumentAtRevision).toHaveBeenCalledWith(
        expect.objectContaining({revisionId: '@release:missing'}),
      )
    })

    it('undefined rev with a publish as newest event uses the publish id', () => {
      const {result} = setup({events: [publishNewest, editOlder, created]})
      expect(result.current.revision?.revisionId).toBe('e1')
    })

    it('undefined rev with a delete-version as newest event uses the newest edit revision', () => {
      const deleted = deleteDocumentVersionEvent({
        id: 'e-del',
        versionRevisionId: 'e-del',
        timestamp: minutesAfterBase(50),
      })
      const {result} = setup({events: [deleted, editNewest, publishNewest, created]})
      // The delete event's versionRevisionId is unreliable; the newest edit is used instead.
      expect(result.current.revision?.revisionId).toBe('e0')
    })

    it('undefined rev with an edit as newest event resolves to no revision (viewing latest)', () => {
      const {result} = setup()
      expect(result.current.revision).toBeNull()
    })

    it('an explicit rev is used as-is', () => {
      const {result} = setup({rev: 'e3'})
      expect(result.current.revision?.revisionId).toBe('e3')
    })
  })

  describe('since resolution', () => {
    it('an explicit since is used as-is', () => {
      const {result} = setup({rev: 'e2', since: 'e4'})
      expect(result.current.sinceRevision?.revisionId).toBe('e4')
    })

    it('defaults to the first publish event older than the selected revision', () => {
      const {result} = setup({rev: 'e2'})
      expect(result.current.sinceRevision?.revisionId).toBe('e3')
    })

    it('@lastPublished picks the first publish event older than the selected revision', () => {
      const {result} = setup({rev: 'e0', since: '@lastPublished'})
      expect(result.current.sinceRevision?.revisionId).toBe('e1')
    })

    it('falls back to the creation event when no publish exists before the revision', () => {
      const {result} = setup({rev: 'e0', events: [editNewest, editOlder, created]})
      expect(result.current.sinceRevision?.revisionId).toBe('e4')
    })

    it('viewing latest with no publish/creation event: uses the second event', () => {
      const olderEdit = editDocumentVersionEvent({
        revisionId: 'e5',
        timestamp: minutesAfterBase(1),
      })
      const {result} = setup({events: [editNewest, editOlder, olderEdit]})
      expect(result.current.sinceRevision?.revisionId).toBe('e2')
    })

    it('with a selected revision and no publish/creation event: uses the event right after it', () => {
      const olderEdit = editDocumentVersionEvent({
        revisionId: 'e5',
        timestamp: minutesAfterBase(1),
      })
      const {result} = setup({rev: 'e2', events: [editNewest, editOlder, olderEdit]})
      expect(result.current.sinceRevision?.revisionId).toBe('e5')
    })
  })

  describe('findRangeForRevision', () => {
    it('selecting the newest event clears the revision (back to latest)', () => {
      const {result} = setup({rev: 'e2'})
      expect(result.current.findRangeForRevision('e0')).toEqual([null, null])
    })

    it('selecting the newest event keeps an explicit since', () => {
      const {result} = setup({rev: 'e2', since: 'e4'})
      expect(result.current.findRangeForRevision('e0')).toEqual(['e4', null])
    })

    it('version documents keep a publish as the newest selectable revision', () => {
      const {result} = setup({
        documentId: 'versions.rX.doc-1',
        events: [publishNewest, editOlder, created],
        rev: 'e2',
      })
      expect(result.current.findRangeForRevision('e1')).toEqual([null, 'e1'])
    })

    it('selecting a newer revision keeps the current revision as since', () => {
      const {result} = setup({rev: 'e2'})
      expect(result.current.findRangeForRevision('e1')).toEqual(['e2', 'e1'])
    })

    it('selecting an older revision clears the since', () => {
      const {result} = setup({rev: 'e2'})
      expect(result.current.findRangeForRevision('e3')).toEqual([null, 'e3'])
    })

    it('keeps a since that is still older than the next revision', () => {
      const {result} = setup({rev: 'e2', since: 'e4'})
      expect(result.current.findRangeForRevision('e1')).toEqual(['e4', 'e1'])
    })

    it('clears a since that would become newer than the next revision', () => {
      const {result} = setup({rev: 'e2', since: 'e1'})
      expect(result.current.findRangeForRevision('e3')).toEqual([null, 'e3'])
    })
  })

  describe('findRangeForSince', () => {
    it('without a selected revision only the since is set', () => {
      const {result} = setup()
      expect(result.current.findRangeForSince('e4')).toEqual(['e4', null])
    })

    it('keeps the revision when the since is older', () => {
      const {result} = setup({rev: 'e2'})
      expect(result.current.findRangeForSince('e4')).toEqual(['e4', 'e2'])
    })

    it('clears the revision when the since would be newer', () => {
      const {result} = setup({rev: 'e2'})
      expect(result.current.findRangeForSince('e0')).toEqual(['e0', null])
    })

    it('clears the revision when the since is not found in the events', () => {
      const {result} = setup({rev: 'e2'})
      expect(result.current.findRangeForSince('unknown')).toEqual(['unknown', null])
    })
  })

  describe('store wiring', () => {
    it('passes isLiveEdit from the schema to createEventsStore', () => {
      mockUseSchema.mockReturnValue({
        get: () => ({liveEdit: true}),
      } as unknown as ReturnType<typeof useSchema>)
      setup()
      expect(mockCreateEventsStore).toHaveBeenCalledWith(
        expect.objectContaining({isLiveEdit: true, documentId: 'drafts.doc-1'}),
      )
    })

    it('subscribes the remote transactions listener for the component lifetime', () => {
      const {store, unmount} = setup()
      expect(store.remoteTransactionsListener).toHaveBeenCalledTimes(1)
      const activeSubscription = store.remoteTransactionsListener.mock.results[0]
        .value as Subscription
      expect(activeSubscription.closed).toBe(false)
      unmount()
      expect(activeSubscription.closed).toBe(true)
    })

    it('getChangesList calls the store with the resolved revision and since observables', () => {
      const {result, store} = setup({rev: 'e2', since: 'e4'})
      result.current.getChangesList()
      expect(store.getDocumentChanges).toHaveBeenCalledTimes(1)
    })

    it('lastNonDeletedRevId skips delete events', () => {
      const deleted = deleteDocumentVersionEvent({
        id: 'e-del',
        versionRevisionId: 'e-del',
        timestamp: minutesAfterBase(50),
      })
      const {result} = setup({events: [deleted, editNewest, created]})
      expect(result.current.lastNonDeletedRevId).toBe('e0')
    })

    it('lastNonDeletedRevId is null when every event is a delete', () => {
      const deleted = deleteDocumentVersionEvent({id: 'e-del', versionRevisionId: 'e-del'})
      const {result} = setup({events: [deleted]})
      expect(result.current.lastNonDeletedRevId).toBeNull()
    })
  })
})
