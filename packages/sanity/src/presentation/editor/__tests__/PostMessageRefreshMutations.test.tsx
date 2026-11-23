import {act, render} from '@testing-library/react'
import {
  type EditStateFor,
  type SanityDocument,
  type TargetDocumentState,
  type useEditState,
  type usePerspective,
  type VersionInfoDocumentStub,
} from 'sanity'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {type VisualEditingConnection} from '../../types'
import PostMessageRefreshMutations from '../PostMessageRefreshMutations'

const mocks = vi.hoisted(() => {
  const listeners = new Set<() => void>()
  let version = 0
  return {
    perspective: {selectedReleaseId: undefined, selectedVariantNames: []} as Pick<
      ReturnType<typeof usePerspective>,
      'selectedReleaseId' | 'selectedVariantNames'
    >,
    targetDocumentState: {status: 'resolving'} as TargetDocumentState,
    editStates: new Map<string | undefined, Partial<EditStateFor>>(),
    editStateCalls: [] as (string | undefined)[],
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getVersion: () => version,
    setEditState: (scopeId: string | undefined, state: Partial<EditStateFor>) => {
      mocks.editStates.set(scopeId, state)
      version++
      listeners.forEach((listener) => listener())
    },
  }
})

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  const {useSyncExternalStore} = await import('react')
  return {
    ...actual,
    usePerspective: () => mocks.perspective as ReturnType<typeof usePerspective>,
    useTargetDocumentState: () => mocks.targetDocumentState,
    useEditState: (...args: Parameters<typeof useEditState>) => {
      const scopeId = args[3]
      useSyncExternalStore(mocks.subscribe, mocks.getVersion)
      mocks.editStateCalls.push(scopeId)
      return {
        ready: true,
        draft: null,
        published: null,
        version: null,
        ...mocks.editStates.get(scopeId),
      } as EditStateFor
    },
  }
})

const GROUP_ID = 'page-1'
const DRAFT_SCOPE = 'hashDraft'
const PUBLISHED_SCOPE = 'hashPublished'

function doc(_id: string, _rev: string): SanityDocument {
  return {_id, _type: 'page', _rev, _createdAt: '', _updatedAt: ''}
}

function stub(_id: string, scopeId: string, bundleId?: string): VersionInfoDocumentStub {
  return {
    _id,
    _type: 'page',
    _rev: 'stub',
    _createdAt: '',
    _updatedAt: '',
    _system: {
      scopeId,
      bundleId,
      group: {_ref: GROUP_ID, _weak: true},
      variants: [{_ref: '_.variants.french', _key: 'k'}],
    },
  }
}

const draftVariantId = `versions.${DRAFT_SCOPE}.${GROUP_ID}`
const publishedVariantId = `versions.${PUBLISHED_SCOPE}.${GROUP_ID}`

function readyVariantState(): TargetDocumentState {
  const draft = stub(draftVariantId, DRAFT_SCOPE, 'drafts')
  return {
    status: 'ready',
    targetDocument: draft,
    scopeId: DRAFT_SCOPE,
    variant: {
      _id: '_.variants.french',
      _type: 'system.variant',
      _rev: 'v1',
      _createdAt: '',
      _updatedAt: '',
      conditions: {locale: 'fr'},
      priority: 0,
    },
    siblings: {
      draft,
      published: stub(publishedVariantId, PUBLISHED_SCOPE),
      version: undefined,
    },
  }
}

function renderRefresh() {
  const post = vi.fn()
  const comlink = {post} as Partial<VisualEditingConnection> as VisualEditingConnection
  render(
    <PostMessageRefreshMutations
      comlink={comlink}
      id={GROUP_ID}
      type="page"
      previewKitConnection="idle"
      loadersConnection="idle"
    />,
  )
  return {post}
}

function postedIds(post: ReturnType<typeof vi.fn>): string[] {
  return post.mock.calls.map(([, payload]) => payload.document._id)
}

describe('PostMessageRefreshMutations', () => {
  beforeEach(() => {
    mocks.perspective = {selectedReleaseId: undefined, selectedVariantNames: []}
    mocks.targetDocumentState = {status: 'resolving'}
    mocks.editStates.clear()
    mocks.editStateCalls.length = 0
  })

  test('refreshes when the base draft changes and no variant is selected', () => {
    mocks.targetDocumentState = {
      status: 'ready',
      targetDocument: undefined,
      scopeId: undefined,
      variant: undefined,
      siblings: {draft: undefined, published: undefined, version: undefined},
    }
    mocks.editStates.set(undefined, {draft: doc(`drafts.${GROUP_ID}`, 'r1')})
    const {post} = renderRefresh()
    expect(post).not.toHaveBeenCalled()

    act(() => mocks.setEditState(undefined, {draft: doc(`drafts.${GROUP_ID}`, 'r2')}))

    expect(postedIds(post)).toEqual([`drafts.${GROUP_ID}`])
    expect(post).toHaveBeenCalledWith(
      'presentation/refresh',
      expect.objectContaining({source: 'mutation'}),
    )
  })

  test('refreshes when the selected variant draft changes', () => {
    mocks.perspective = {selectedReleaseId: undefined, selectedVariantNames: ['french']}
    mocks.targetDocumentState = readyVariantState()
    mocks.editStates.set(DRAFT_SCOPE, {version: doc(draftVariantId, 'r1')})
    const {post} = renderRefresh()
    expect(mocks.editStateCalls).toContain(DRAFT_SCOPE)
    expect(post).not.toHaveBeenCalled()

    act(() => mocks.setEditState(DRAFT_SCOPE, {version: doc(draftVariantId, 'r2')}))

    expect(postedIds(post)).toEqual([draftVariantId])
  })

  test('refreshes when the selected variant is published', () => {
    mocks.perspective = {selectedReleaseId: undefined, selectedVariantNames: ['french']}
    mocks.targetDocumentState = readyVariantState()
    mocks.editStates.set(DRAFT_SCOPE, {version: doc(draftVariantId, 'r1')})
    mocks.editStates.set(PUBLISHED_SCOPE, {version: doc(publishedVariantId, 'p1')})
    const {post} = renderRefresh()

    act(() => mocks.setEditState(DRAFT_SCOPE, {version: null}))
    act(() => mocks.setEditState(PUBLISHED_SCOPE, {version: doc(publishedVariantId, 'p2')}))

    expect(postedIds(post)).toEqual([publishedVariantId])
  })

  test('does not watch the base pair while the variant target is resolving', () => {
    mocks.perspective = {selectedReleaseId: undefined, selectedVariantNames: ['french']}
    mocks.editStates.set(undefined, {draft: doc(`drafts.${GROUP_ID}`, 'r1')})
    const {post} = renderRefresh()

    act(() => mocks.setEditState(undefined, {draft: doc(`drafts.${GROUP_ID}`, 'r2')}))

    expect(post).not.toHaveBeenCalled()
  })
})
