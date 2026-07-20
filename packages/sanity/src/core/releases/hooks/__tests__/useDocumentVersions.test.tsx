import {type ReleaseDocument} from '@sanity/client'
import {getPublishedId} from '@sanity/client/csm'
import {type DocumentSystem} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import {BehaviorSubject, concat, NEVER, of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {type DocumentPreviewStore} from '../../../preview'
import {useDocumentPreviewStore} from '../../../store'
import {activeASAPRelease, activeScheduledRelease} from '../../__fixtures__/release.fixture'
import {type ReleasesReducerState} from '../../store/reducer'
import {
  type DocumentPerspectiveState,
  getOrCreateDocumentVersionsObservable,
  observableCache,
  useDocumentVersions,
  withSystemCache,
} from '../useDocumentVersions'

vi.mock('../../../hooks/useDataset', () => ({
  useDataset: vi.fn().mockReturnValue('test'),
}))

vi.mock('../../../hooks/useProjectId', () => ({
  useProjectId: vi.fn().mockReturnValue('test-project'),
}))

vi.mock('../../../store', () => ({
  useDocumentPreviewStore: vi.fn(),
}))

const initialReleasesState: ReleasesReducerState = {
  releases: new Map(),
  state: 'loaded',
}
const mockReleasesState$ = new BehaviorSubject<ReleasesReducerState>(initialReleasesState)
const mockDispatch = vi.fn()

vi.mock('../../store/useReleasesStore', () => ({
  useReleasesStore: () => ({state$: mockReleasesState$, dispatch: mockDispatch}),
}))

async function setupMocks({
  releases,
  versionIds,
  observeSystem = true,
  pendingIdSet = false,
}: {
  releases: ReleaseDocument[]
  versionIds: string[]
  /**
   * When `false`, versions are returned without `_system`, so the hook
   * falls back to `buildDocumentSystem`.
   */
  observeSystem?: boolean
  /** When `true`, the version document ids observable never emits (initial loading state). */
  pendingIdSet?: boolean
}) {
  const mockDocumentPreviewStore = useDocumentPreviewStore as Mock<typeof useDocumentPreviewStore>

  mockDocumentPreviewStore.mockReturnValue({
    unstable_observeVersionDocumentIds: vi
      .fn<DocumentPreviewStore['unstable_observeVersionDocumentIds']>()
      .mockReturnValue(pendingIdSet ? NEVER : of(versionIds)),
    observePaths: vi
      .fn<DocumentPreviewStore['observePaths']>()
      .mockImplementation((value: {_id: string}) => {
        const id = value._id
        return of(
          observeSystem
            ? {
                _id: id,
                _rev: '',
                _createdAt: '',
                _updatedAt: '',
                _system: {
                  bundleId: 'drafts',
                  group: {_ref: getPublishedId(id), _weak: true},
                  scopeId: getPublishedId(id),
                } satisfies DocumentSystem,
              }
            : {
                _id: id,
                _rev: '',
                _createdAt: '',
                _updatedAt: '',
              },
        )
      }),
  } as unknown as DocumentPreviewStore)

  mockReleasesState$.next({
    releases: new Map(releases.map((release) => [release._id, release])),
    state: 'loaded',
  })
}

describe('useDocumentVersions', () => {
  beforeEach(() => {
    observableCache.clear()
    withSystemCache.clear()
    mockReleasesState$.next(initialReleasesState)
  })

  it('should return initial state', async () => {
    await setupMocks({
      releases: [activeASAPRelease, activeScheduledRelease],
      versionIds: [],
      pendingIdSet: true,
    })

    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(null)
    expect(result.current.data).toEqual([])
  })

  it('should return an empty array if no versions are found', async () => {
    await setupMocks({releases: [activeASAPRelease, activeScheduledRelease], versionIds: []})
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.data).toEqual([])
  })

  it('should return the releases if versions are found', async () => {
    await setupMocks({
      releases: [activeASAPRelease],
      versionIds: ['versions.rASAP.document-1'],
    })
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    await waitFor(() => {
      expect(result.current.data).toEqual(['versions.rASAP.document-1'])
    })
    expect(result.current.versions).toEqual([
      {
        _id: 'versions.rASAP.document-1',
        _rev: '',
        _createdAt: '',
        _updatedAt: '',
        _system: {
          bundleId: 'drafts',
          group: {_ref: 'document-1', _weak: true},
          scopeId: 'document-1',
        },
      },
    ])
  })

  it('should fall back to a temporarily built system when the document has no system', async () => {
    await setupMocks({
      releases: [activeASAPRelease],
      versionIds: ['versions.rASAP.document-1'],
      observeSystem: false,
    })
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    await waitFor(() => {
      expect(result.current.data).toEqual(['versions.rASAP.document-1'])
    })
    expect(result.current.versions).toEqual([
      {
        _id: 'versions.rASAP.document-1',
        _rev: '',
        _createdAt: '',
        _updatedAt: '',
        _system: {
          bundleId: 'rASAP',
          release: {_ref: '_.releases.rASAP', _weak: true},
          variant: undefined,
          group: {_ref: 'document-1', _weak: true},
          scopeId: 'rASAP',
        },
      },
    ])
  })

  it('should build a drafts system when a draft document has no system', async () => {
    await setupMocks({
      releases: [activeASAPRelease],
      versionIds: ['drafts.document-1'],
      observeSystem: false,
    })
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    await waitFor(() => {
      expect(result.current.data).toEqual(['drafts.document-1'])
    })
    expect(result.current.versions).toEqual([
      {
        _id: 'drafts.document-1',
        _rev: '',
        _createdAt: '',
        _updatedAt: '',
        _system: {
          bundleId: 'drafts',
          release: undefined,
          variant: undefined,
          group: {_ref: 'document-1', _weak: true},
          scopeId: undefined,
        },
      },
    ])
  })
})

/**
 * Regression tests for the read-only flip: subscriber churn (components
 * re-rendering/remounting around commits) momentarily drops the shared
 * pipeline's refcount to zero. With a bare teardown the cache entry is
 * deleted, and the re-created pipeline synchronously re-enters the
 * `startWith(loadingState)` path (the version id set is non-empty for any
 * document with a draft), so `loading: true` reaches `useDocumentForm`'s
 * `ready` gate and flips the form read-only mid-typing — silently swallowing
 * keystrokes.
 */
describe('getOrCreateDocumentVersionsObservable — subscriber churn', () => {
  beforeEach(() => {
    observableCache.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createPreviewStore() {
    // The production sources never complete (they follow the invalidation
    // channel), so keep the mocks open-ended — a completing source would
    // reset the share and mask the behavior under test.
    const unstable_observeVersionDocumentIds = vi.fn(() => concat(of(['drafts.document-1']), NEVER))
    const observePaths = vi.fn((value: unknown) =>
      concat(
        of({
          _id: (value as {_id: string})._id,
          _rev: '',
          _createdAt: '',
          _updatedAt: '',
        }),
        NEVER,
      ),
    )
    return {
      unstable_observeVersionDocumentIds,
      observePaths,
    } as unknown as DocumentPreviewStore
  }

  // The module-level swr cache is keyed by `projectId-dataset-publishedId` and survives across
  // tests, so each test uses its own publishedId to avoid replaying another test's cached id set.
  const options = (documentPreviewStore: DocumentPreviewStore, publishedId: string) => ({
    documentPreviewStore,
    publishedId,
    projectId: 'test-project',
    dataset: 'test',
  })

  it('does not re-emit loading: true to a subscriber arriving right after a zero-subscriber gap', () => {
    vi.useFakeTimers()
    const previewStore = createPreviewStore()
    const state$ = getOrCreateDocumentVersionsObservable(options(previewStore, 'churn-1'))

    const first: DocumentPerspectiveState[] = []
    const firstSub = state$.subscribe((value) => first.push(value))
    expect(first.at(-1)?.loading).toBe(false)

    // Churn: refcount drops to zero, then a new subscriber arrives before the
    // teardown grace period has elapsed.
    firstSub.unsubscribe()
    vi.advanceTimersByTime(100)

    const second: DocumentPerspectiveState[] = []
    const secondSub = state$.subscribe((value) => second.push(value))

    // The pipeline must still be warm: the new subscriber synchronously gets
    // the loaded state, never a loading replay, and the cache entry survives.
    expect(second).toHaveLength(1)
    expect(second[0].loading).toBe(false)
    expect(observableCache.size).toBe(1)
    expect(previewStore.unstable_observeVersionDocumentIds).toHaveBeenCalledTimes(1)

    secondSub.unsubscribe()
  })

  it('tears down and evicts the cache entry after the grace period', () => {
    vi.useFakeTimers()
    const previewStore = createPreviewStore()
    const state$ = getOrCreateDocumentVersionsObservable(options(previewStore, 'churn-2'))

    const sub = state$.subscribe()
    sub.unsubscribe()
    vi.advanceTimersByTime(2_000)

    expect(observableCache.size).toBe(0)
  })

  /**
   * Regression test for SAPP-4053: on a brand-new document the version id set
   * changes as soon as the first keystroke creates the draft (`[]` →
   * `['drafts.<id>']`). Re-emitting `loading: true` for that change flips the
   * form read-only mid-typing, dropping DOM focus from the editor (which in
   * turn caused the PTE caret to jump to the start of the block).
   */
  it('does not re-emit loading: true when the version id set changes after the initial load', () => {
    const ids$ = new Subject<string[]>()
    const observePaths = vi.fn((value: unknown) =>
      concat(
        of({
          _id: (value as {_id: string})._id,
          _rev: '',
          _createdAt: '',
          _updatedAt: '',
        }),
        NEVER,
      ),
    )
    const previewStore = {
      unstable_observeVersionDocumentIds: vi.fn(() => ids$),
      observePaths,
    } as unknown as DocumentPreviewStore

    const state$ = getOrCreateDocumentVersionsObservable(options(previewStore, 'id-set-change'))
    const emissions: DocumentPerspectiveState[] = []
    const sub = state$.subscribe((value) => emissions.push(value))

    // Cold start: a non-empty initial id set must still block with loading: true.
    ids$.next(['drafts.document-1'])
    expect(emissions.map((e) => e.loading)).toEqual([true, false])

    // First keystroke on a new document: the draft id appears while the user
    // is typing. The pipeline must go straight to the loaded state.
    ids$.next(['drafts.document-1', 'versions.rASAP.document-1'])
    expect(emissions.map((e) => e.loading)).toEqual([true, false, false])
    expect(emissions.at(-1)?.data).toEqual(['drafts.document-1', 'versions.rASAP.document-1'])

    sub.unsubscribe()
  })

  it('still emits loading: true for a cold start whose first id set is non-empty', () => {
    const previewStore = createPreviewStore()
    const state$ = getOrCreateDocumentVersionsObservable(options(previewStore, 'cold-start'))

    const emissions: DocumentPerspectiveState[] = []
    const sub = state$.subscribe((value) => emissions.push(value))

    expect(emissions.map((e) => e.loading)).toEqual([true, false])

    sub.unsubscribe()
  })
})
