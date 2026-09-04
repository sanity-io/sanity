import {type SanityDocument} from '@sanity/types'
import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {perspectiveContextValueMock} from '../../perspective/__mocks__/usePerspective.mock'
import {usePerspective} from '../../perspective/usePerspective'
import {activeASAPRelease} from '../../releases/__fixtures__/release.fixture'
import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {useArchivedReleases} from '../../releases/store/useArchivedReleases'
import {type EditStateFor} from '../../store/document/document-pair/editState'
import {useWorkspace} from '../../studio/workspace'
import {useDocumentIdStack} from '../useDocumentIdStack'

vi.mock('../../studio/workspace', () => ({useWorkspace: vi.fn()}))
vi.mock('../../perspective/usePerspective', () => ({usePerspective: vi.fn()}))
vi.mock('../../releases/hooks/useDocumentVersions', () => ({useDocumentVersions: vi.fn()}))
vi.mock('../../releases/store/useActiveReleases', () => ({useActiveReleases: vi.fn()}))
vi.mock('../../releases/store/useArchivedReleases', () => ({useArchivedReleases: vi.fn()}))

const ID = 'author-1'
const DRAFT_ID = `drafts.${ID}`
const RELEASE_VERSION_ID = `versions.rASAP.${ID}`
const PAIR_IDS = [ID, DRAFT_ID]
const PAIR_AND_RELEASE_IDS = [ID, DRAFT_ID, RELEASE_VERSION_ID]
const ACTIVE_RELEASES: ReturnType<typeof useActiveReleases> = {
  data: [activeASAPRelease],
  byId: new Map([[activeASAPRelease._id, activeASAPRelease]]),
  loading: false,
  dispatch: () => undefined,
}
const ARCHIVED_RELEASES: ReturnType<typeof useArchivedReleases> = {data: [], loading: false}

function doc(id: string, rev: string): SanityDocument {
  return {
    _id: id,
    _type: 'author',
    _rev: rev,
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
  }
}

/**
 * The inputs after one keystroke: the store hands out new draft, published and displayed objects
 * carrying a new revision, while every id stays the same.
 */
function keystroke(rev: string): Parameters<typeof useDocumentIdStack>[0] {
  const draft = doc(DRAFT_ID, `draft-${rev}`)
  const editState: EditStateFor = {
    id: ID,
    type: 'author',
    transactionSyncLock: {enabled: false},
    draft,
    published: doc(ID, 'published-1'),
    version: null,
    liveEdit: false,
    liveEditSchemaType: false,
    ready: true,
    release: undefined,
    scopeId: undefined,
  }
  return {displayed: draft, documentId: ID, editState}
}

function mockVersionIds(ids: string[]) {
  vi.mocked(useDocumentVersions).mockImplementation(() => ({
    data: ids,
    versions: [],
    error: null,
    loading: false,
  }))
}

describe('useDocumentIdStack', () => {
  beforeEach(() => {
    vi.mocked(useWorkspace).mockReturnValue({
      document: {drafts: {enabled: true}},
    } as unknown as ReturnType<typeof useWorkspace>)
    vi.mocked(usePerspective).mockReturnValue(perspectiveContextValueMock)
    vi.mocked(useActiveReleases).mockReturnValue(ACTIVE_RELEASES)
    vi.mocked(useArchivedReleases).mockReturnValue(ARCHIVED_RELEASES)
    mockVersionIds(PAIR_AND_RELEASE_IDS)
  })

  it('keeps the stack referentially stable across draft revisions', () => {
    const {result, rerender} = renderHook(useDocumentIdStack, {initialProps: keystroke('1')})
    const before = result.current
    expect(before.stack).toEqual([ID, DRAFT_ID, RELEASE_VERSION_ID])
    expect(before.position).toBe(1)

    rerender(keystroke('2'))

    expect(result.current).toBe(before)
  })

  it('rebuilds the stack when a version appears or the displayed document changes', () => {
    mockVersionIds(PAIR_IDS)
    const {result, rerender} = renderHook(useDocumentIdStack, {initialProps: keystroke('1')})
    const before = result.current
    expect(before.stack).toEqual([ID, DRAFT_ID])
    expect(before.nextId).toBeUndefined()

    mockVersionIds(PAIR_AND_RELEASE_IDS)
    rerender(keystroke('2'))

    expect(result.current).not.toBe(before)
    expect(result.current.nextId).toBe(RELEASE_VERSION_ID)

    rerender({...keystroke('3'), displayed: doc(ID, 'published-1')})

    expect(result.current.position).toBe(0)
    expect(result.current.previousId).toBeUndefined()
  })
})
