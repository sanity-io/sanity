import {type ReleaseDocument} from '@sanity/client'
import {act, renderHook} from '@testing-library/react'
import {BehaviorSubject, of} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {
  type DocumentPerspectiveState,
  useDocumentVersionsObservable,
} from '../../releases/hooks/useDocumentVersions'
import {type ReleasesReducerState} from '../../releases/store/reducer'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {useReleasesStore} from '../../releases/store/useReleasesStore'
import {getReleaseDocumentIdFromReleaseId} from '../../releases/util/getReleaseDocumentIdFromReleaseId'
import {useAgentBundlesStore} from '../../store/agent/useAgentBundles'
import {useWorkspace} from '../../studio/workspace'
import {getPublishedId, getVersionFromId, isDraftId, isVersionId} from '../../util/draftUtils'
import {useVariantsStore} from '../../variants/store/useVariantsStore'
import {useDocumentGroupSets} from './useDocumentGroupSets'

vi.mock('../../releases/hooks/useDocumentVersions', () => ({
  useDocumentVersionsObservable: vi.fn(),
}))

vi.mock('../../releases/store/useReleasesStore', () => ({
  useReleasesStore: vi.fn(),
}))

vi.mock('../../variants/store/useVariantsStore', () => ({
  useVariantsStore: vi.fn(),
}))

vi.mock('../../store/agent/useAgentBundles', () => ({
  useAgentBundlesStore: vi.fn(),
}))

vi.mock('../../studio/workspace', () => ({
  useWorkspace: vi.fn(),
}))

vi.mock('../../i18n/hooks/useTranslation', () => {
  // Kept stable across renders: `t` is a dependency of the hook's memoized observable.
  const translation = {t: (key: string) => key}
  return {useTranslation: vi.fn(() => translation)}
})

const mockUseDocumentVersionsObservable = useDocumentVersionsObservable as Mock
const mockUseReleasesStore = useReleasesStore as Mock
const mockUseVariantsStore = useVariantsStore as Mock
const mockUseAgentBundlesStore = useAgentBundlesStore as Mock
const mockUseWorkspace = useWorkspace as Mock

// Builds the version document stub the way `useDocumentVersions` emits it,
// deriving `_system` from the document id.
function versionStub(
  id: string,
  overrides: Partial<VersionInfoDocumentStub['_system']> = {},
): VersionInfoDocumentStub {
  const bundleId = getVersionFromId(id)
  const group = {_ref: getPublishedId(id), _weak: true} as const

  return {
    _id: id,
    _rev: 'rev',
    _createdAt: '2024-01-01T00:00:00.000Z',
    _updatedAt: '2024-01-01T00:00:00.000Z',
    _type: 'version',
    _system: {
      ...(isDraftId(id)
        ? {bundleId: 'drafts', group}
        : isVersionId(id) && typeof bundleId === 'string'
          ? {
              bundleId,
              release: {_ref: getReleaseDocumentIdFromReleaseId(bundleId), _weak: true},
              group,
            }
          : {group}),
      ...overrides,
    },
  }
}

function versionState(ids: string[], versions?: VersionInfoDocumentStub[]) {
  return {
    data: ids,
    versions: versions ?? ids.map((id) => versionStub(id)),
    loading: false,
    error: null,
  } satisfies DocumentPerspectiveState
}

const loadedVariants = {variants: new Map(), state: 'loaded'}
const loadedAgentBundles = {bundles: [], loading: false}

function loadedReleases(
  releases = new Map<string, ReleaseDocument>(),
): Pick<ReleasesReducerState, 'releases' | 'state'> {
  return {releases, state: 'loaded'}
}

describe('useDocumentGroupSets', () => {
  beforeEach(() => {
    mockUseDocumentVersionsObservable.mockReturnValue(of(versionState(['drafts.foo', 'foo'])))
    mockUseReleasesStore.mockReturnValue({state$: of(loadedReleases())})
    mockUseVariantsStore.mockReturnValue({state$: of(loadedVariants)})
    mockUseAgentBundlesStore.mockReturnValue({state$: of(loadedAgentBundles)})
    mockUseWorkspace.mockReturnValue({beta: {variants: {enabled: false}}})
  })

  it('computes a single set of named versions when variants are disabled', () => {
    const release = {
      metadata: {title: 'My Release'},
    } as unknown as ReleaseDocument
    const releases = new Map([[getReleaseDocumentIdFromReleaseId('rABC'), release]])
    mockUseReleasesStore.mockReturnValue({state$: of(loadedReleases(releases))})
    mockUseDocumentVersionsObservable.mockReturnValue(
      of(versionState(['drafts.foo', 'foo', 'versions.rABC.foo'])),
    )

    const {result} = renderHook(() => useDocumentGroupSets({documentId: 'foo'}))

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(false)
    expect(result.current.sets).toHaveLength(1)
    expect(result.current.sets[0].key).toBe('studio:all')
    expect(result.current.sets[0].variants.map(({id, name}) => ({id, name}))).toEqual([
      {id: 'drafts.foo', name: 'release.chip.draft'},
      {id: 'foo', name: 'release.chip.published'},
      {id: 'versions.rABC.foo', name: 'My Release'},
    ])
    expect(result.current.releases).toBe(releases)
  })

  it('groups versions into one set per bundle when variants are enabled', () => {
    mockUseWorkspace.mockReturnValue({beta: {variants: {enabled: true}}})

    const variantDefinition = {
      _id: 'variant-doc-a',
      metadata: {title: 'Audience A'},
    }
    mockUseVariantsStore.mockReturnValue({
      state$: of({variants: new Map([['variant-doc-a', variantDefinition]]), state: 'loaded'}),
    })
    mockUseDocumentVersionsObservable.mockReturnValue(
      of(
        versionState(
          ['drafts.foo', 'versions.scope1.foo'],
          [
            versionStub('drafts.foo'),
            versionStub('versions.scope1.foo', {
              bundleId: 'drafts',
              release: undefined,
              variant: {_ref: 'variant-doc-a', _weak: true},
            }),
          ],
        ),
      ),
    )

    const {result} = renderHook(() => useDocumentGroupSets({documentId: 'foo'}))

    expect(result.current.sets).toHaveLength(1)
    expect(result.current.sets[0].key).toBe('drafts')
    expect(result.current.sets[0].name).toBe('release.chip.draft')
    expect(result.current.sets[0].variants.map(({id, name}) => ({id, name}))).toEqual([
      {id: 'drafts.foo', name: 'document-group.base-variant'},
      {id: 'versions.scope1.foo', name: 'Audience A'},
    ])
  })

  it('reports loading until every store has settled', () => {
    const releases$ = new BehaviorSubject({releases: new Map(), state: 'loading'})
    mockUseReleasesStore.mockReturnValue({state$: releases$})

    const {result} = renderHook(() => useDocumentGroupSets({documentId: 'foo'}))
    expect(result.current.loading).toBe(true)

    act(() => releases$.next(loadedReleases()))
    expect(result.current.loading).toBe(false)

    // Once settled, stay settled: a store reloading must not flip the state back.
    act(() => releases$.next({releases: new Map(), state: 'loading'}))
    expect(result.current.loading).toBe(false)
  })

  it('reports an error when the version state fails', () => {
    mockUseDocumentVersionsObservable.mockReturnValue(
      of({data: [], versions: [], loading: false, error: new Error('meta failed')}),
    )

    const {result} = renderHook(() => useDocumentGroupSets({documentId: 'foo'}))
    expect(result.current.error).toBe(true)
  })
})
