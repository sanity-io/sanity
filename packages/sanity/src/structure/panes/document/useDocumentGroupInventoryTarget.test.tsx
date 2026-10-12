import {type ReleaseDocument} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {renderHook} from '@testing-library/react'
import {
  type EditStateFor,
  type PerspectiveContextValue,
  type TargetDocumentState,
  useIsDocumentGroupInventoryAvailable,
  usePerspective,
  useWorkspace,
  type Workspace,
} from 'sanity'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {usePaneRouter} from '../../components/paneRouter/usePaneRouter'
import {type DocumentPaneContextValue} from './DocumentPaneContext'
import {useDocumentGroupInventoryTarget} from './useDocumentGroupInventoryTarget'
import {useDocumentPane} from './useDocumentPane'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useIsDocumentGroupInventoryAvailable: vi.fn(),
  usePerspective: vi.fn(),
  useWorkspace: vi.fn(),
}))

vi.mock('./useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(),
}))

const TIMESTAMPS = {
  _rev: 'rev-1',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
}
const DRAFT: SanityDocument = {
  _id: 'drafts.doc-123',
  _type: 'author',
  title: 'Draft',
  ...TIMESTAMPS,
}
const PUBLISHED: SanityDocument = {
  _id: 'doc-123',
  _type: 'author',
  title: 'Published',
  ...TIMESTAMPS,
}

const EDIT_STATE: EditStateFor = {
  id: 'doc-123',
  type: 'author',
  transactionSyncLock: {enabled: false},
  draft: DRAFT,
  published: PUBLISHED,
  version: null,
  liveEdit: false,
  liveEditSchemaType: false,
  ready: true,
  release: undefined,
  scopeId: undefined,
}

const READY_TARGET: TargetDocumentState = {
  status: 'ready',
  targetDocument: undefined,
  scopeId: undefined,
  variant: undefined,
  siblings: {published: undefined, draft: undefined, version: undefined},
}

const ACTIVE_RELEASE: ReleaseDocument = {
  _id: '_.releases.rASAP',
  _type: 'system.release',
  name: 'rASAP',
  state: 'active',
  metadata: {title: 'ASAP release', releaseType: 'asap'},
  ...TIMESTAMPS,
}

function paneValue(overrides: Partial<DocumentPaneContextValue> = {}): DocumentPaneContextValue {
  return {
    documentId: 'doc-123',
    documentType: 'author',
    displayed: DRAFT,
    editState: EDIT_STATE,
    targetDocumentState: READY_TARGET,
    revisionNotFound: false,
    ...overrides,
  } as DocumentPaneContextValue
}

function setPerspective(overrides: Partial<PerspectiveContextValue> = {}) {
  vi.mocked(usePerspective).mockReturnValue({
    selectedPerspective: undefined,
    selectedVariantNames: [],
    ...overrides,
  } as PerspectiveContextValue)
}

function setWorkspace(beta: Workspace['beta']) {
  vi.mocked(useWorkspace).mockReturnValue({beta} as Workspace)
}

function setRouterParams(params: Record<string, string>) {
  vi.mocked(usePaneRouter).mockReturnValue({params} as ReturnType<typeof usePaneRouter>)
}

describe('useDocumentGroupInventoryTarget', () => {
  beforeEach(() => {
    setWorkspace({documentGroupInventory: {enabled: true}})
    setPerspective()
    setRouterParams({})
    vi.mocked(useDocumentPane).mockReturnValue(paneValue())
    vi.mocked(useIsDocumentGroupInventoryAvailable).mockReturnValue(true)
  })

  it('targets the displayed document when the inventory can be opened', () => {
    const {result} = renderHook(() => useDocumentGroupInventoryTarget())

    expect(result.current).toEqual({isAvailable: true, documentId: 'drafts.doc-123'})
    expect(useIsDocumentGroupInventoryAvailable).toHaveBeenCalledWith({
      documentId: 'drafts.doc-123',
    })
  })

  it('targets the version that is going to be unpublished, not the published document it displays', () => {
    const unpublishingVersion: SanityDocument = {
      _id: 'versions.rASAP.doc-123',
      _type: 'author',
      _system: {delete: true},
      ...TIMESTAMPS,
    }
    vi.mocked(useDocumentPane).mockReturnValue(
      paneValue({
        displayed: PUBLISHED,
        editState: {...EDIT_STATE, version: unpublishingVersion},
      }),
    )

    const {result} = renderHook(() => useDocumentGroupInventoryTarget())

    expect(result.current).toEqual({isAvailable: true, documentId: 'versions.rASAP.doc-123'})
  })

  it('is unavailable when the feature is not enabled', () => {
    setWorkspace(undefined)

    const {result} = renderHook(() => useDocumentGroupInventoryTarget())

    expect(result.current).toEqual({isAvailable: false})
  })

  it('is unavailable while the document group has no versions (deleted or never created)', () => {
    vi.mocked(useIsDocumentGroupInventoryAvailable).mockReturnValue(false)
    vi.mocked(useDocumentPane).mockReturnValue(
      paneValue({
        // `DocumentPaneProvider` falls back to an id/type stub when no document exists.
        displayed: {_id: 'doc-123', _type: 'author'},
        isDeleted: true,
        editState: {...EDIT_STATE, draft: null, published: null},
      }),
    )

    const {result} = renderHook(() => useDocumentGroupInventoryTarget())

    expect(result.current).toEqual({isAvailable: false})
    // The lookup still runs for the document group, so the target resolves once versions exist.
    expect(useIsDocumentGroupInventoryAvailable).toHaveBeenCalledWith({documentId: 'doc-123'})
  })

  it('is unavailable while the edit state is not ready', () => {
    vi.mocked(useDocumentPane).mockReturnValue(
      paneValue({editState: {...EDIT_STATE, ready: false}}),
    )

    const {result} = renderHook(() => useDocumentGroupInventoryTarget())

    expect(result.current).toEqual({isAvailable: false})
  })

  it('is unavailable when the published perspective is selected and nothing is published', () => {
    setPerspective({selectedPerspective: 'published'})
    vi.mocked(useDocumentPane).mockReturnValue(
      paneValue({editState: {...EDIT_STATE, published: null}}),
    )

    const {result} = renderHook(() => useDocumentGroupInventoryTarget())

    expect(result.current).toEqual({isAvailable: false})
  })

  it('is unavailable when a release is selected and the document has no version in it', () => {
    setPerspective({selectedPerspective: ACTIVE_RELEASE})

    const {result} = renderHook(() => useDocumentGroupInventoryTarget())

    expect(result.current).toEqual({isAvailable: false})
  })

  it('is unavailable when the requested variant has no target document', () => {
    setPerspective({selectedVariantNames: ['variant-a']})
    vi.mocked(useDocumentPane).mockReturnValue(
      paneValue({targetDocumentState: {status: 'resolving'}}),
    )

    const {result} = renderHook(() => useDocumentGroupInventoryTarget())

    expect(result.current).toEqual({isAvailable: false})
  })

  it('is unavailable when the pane shows a revision that could not be found', () => {
    setRouterParams({rev: 'rev-404'})
    vi.mocked(useDocumentPane).mockReturnValue(paneValue({revisionNotFound: true}))

    const {result} = renderHook(() => useDocumentGroupInventoryTarget())

    expect(result.current).toEqual({isAvailable: false})
  })

  it('stays available when the pane shows a revision that was found', () => {
    setRouterParams({rev: 'rev-1'})

    const {result} = renderHook(() => useDocumentGroupInventoryTarget())

    expect(result.current).toEqual({isAvailable: true, documentId: 'drafts.doc-123'})
  })
})
