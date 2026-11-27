import {act, render} from '@testing-library/react'
import {useSyncExternalStore} from 'react'
import {type EditStateFor, type SanityDocument} from 'sanity'
import {describe, expect, test, vi} from 'vitest'

import {type ConnectionStatus, type VisualEditingConnection} from '../../types'
import PostMessageRefreshMutations from '../PostMessageRefreshMutations'

// The component is memoized, so a plain `vi.fn()` mock wouldn't re-render it. Drive both hooks from
// an external store instead, like a real edit state emission
const store = vi.hoisted(() => {
  const states = new Map<string, Partial<EditStateFor>>()
  const empty: Partial<EditStateFor> = {}
  const listeners = new Set<() => void>()
  let selectedReleaseId: string | undefined
  const notify = () => listeners.forEach((listener) => listener())
  return {
    getEditState: (id: string, releaseId: string | undefined) =>
      states.get(`${id}:${releaseId ?? ''}`) ?? empty,
    setEditState: (id: string, releaseId: string | undefined, next: Partial<EditStateFor>) => {
      states.set(`${id}:${releaseId ?? ''}`, next)
      notify()
    },
    getSelectedReleaseId: () => selectedReleaseId,
    setSelectedReleaseId: (releaseId: string | undefined) => {
      selectedReleaseId = releaseId
      notify()
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
})

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useEditState: (id: string, _type: string, _priority: string, releaseId?: string) => {
    const getSnapshot = () => store.getEditState(id, releaseId)
    return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot)
  },
  usePerspective: () => ({
    selectedReleaseId: useSyncExternalStore(
      store.subscribe,
      store.getSelectedReleaseId,
      store.getSelectedReleaseId,
    ),
  }),
}))

const ID = 'page'
const TYPE = 'page'

function doc(_id: string, _rev: string, slug?: string): SanityDocument {
  return {
    _id,
    _type: TYPE,
    _rev,
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    ...(slug ? {slug: {_type: 'slug', current: slug}} : {}),
  }
}

function editState(
  state: Partial<Pick<EditStateFor, 'draft' | 'published' | 'version' | 'ready'>>,
): Partial<EditStateFor> {
  return {draft: null, published: null, version: null, ready: true, ...state}
}

function createComlink() {
  const post = vi.fn<(...params: unknown[]) => void>()
  const comlink: VisualEditingConnection = {
    on: () => () => undefined,
    onInternalEvent: () => () => undefined,
    onStatus: () => undefined,
    post: (...params) => post(...params),
    start: () => () => undefined,
    stop: () => undefined,
  }
  return {comlink, post}
}

function renderRefresh(
  initial: Partial<EditStateFor>,
  options: {loadersConnection?: ConnectionStatus; releaseId?: string} = {},
) {
  const {releaseId} = options
  store.setSelectedReleaseId(releaseId)
  store.setEditState(ID, releaseId, initial)
  const {comlink, post} = createComlink()
  const props = {
    comlink,
    type: TYPE,
    previewKitConnection: 'idle' as const,
    loadersConnection: options.loadersConnection ?? ('idle' as const),
  }
  const view = render(<PostMessageRefreshMutations {...props} id={ID} />)
  return {
    post,
    update: (next: Partial<EditStateFor>) => act(() => store.setEditState(ID, releaseId, next)),
    switchDocument: (nextId: string, next: Partial<EditStateFor>) => {
      act(() => store.setEditState(nextId, releaseId, next))
      view.rerender(<PostMessageRefreshMutations {...props} id={nextId} />)
    },
    switchRelease: (nextReleaseId: string | undefined, next: Partial<EditStateFor>) =>
      act(() => {
        store.setEditState(ID, nextReleaseId, next)
        store.setSelectedReleaseId(nextReleaseId)
      }),
  }
}

function refreshFor(document: SanityDocument, livePreviewEnabled = false) {
  const {_id, _type, _rev, slug} = document
  return [
    'presentation/refresh',
    {source: 'mutation', livePreviewEnabled, document: {_id, _type, _rev, slug}},
  ] as const
}

describe('PostMessageRefreshMutations', () => {
  test('does not refresh when it mounts', () => {
    const {post} = renderRefresh(
      editState({draft: doc('drafts.page', 'd1'), published: doc('page', 'p1')}),
    )

    expect(post).not.toHaveBeenCalled()
  })

  test('does not refresh when the edit state becomes ready', () => {
    const {post, update} = renderRefresh(editState({ready: false}))

    update(editState({draft: doc('drafts.page', 'd1'), published: doc('page', 'p1')}))

    expect(post).not.toHaveBeenCalled()
  })

  test('refreshes with the draft when the draft changes', () => {
    const published = doc('page', 'p1')
    const {post, update} = renderRefresh(editState({draft: doc('drafts.page', 'd1'), published}))
    const draft = doc('drafts.page', 'd2', 'home')

    update(editState({draft, published}))

    expect(post).toHaveBeenCalledExactlyOnceWith(...refreshFor(draft))
  })

  test('refreshes with the discarded draft when changes are discarded', () => {
    const draft = doc('drafts.page', 'd1', 'home')
    const published = doc('page', 'p1', 'home')
    const {post, update} = renderRefresh(editState({draft, published}))

    update(editState({published}))

    expect(post).toHaveBeenCalledExactlyOnceWith(...refreshFor(draft))
  })

  test('refreshes with the removed document when it is unpublished and a draft already exists', () => {
    const draft = doc('drafts.page', 'd1')
    const published = doc('page', 'p1')
    const {post, update} = renderRefresh(editState({draft, published}))

    update(editState({draft}))

    expect(post).toHaveBeenCalledExactlyOnceWith(...refreshFor(published))
  })

  test('refreshes once with the new draft when unpublishing creates the draft', () => {
    const {post, update} = renderRefresh(editState({published: doc('page', 'p1')}))
    const draft = doc('drafts.page', 'd1')

    update(editState({draft}))

    expect(post).toHaveBeenCalledExactlyOnceWith(...refreshFor(draft))
  })

  test('refreshes once with the published document when the draft is published', () => {
    const {post, update} = renderRefresh(
      editState({draft: doc('drafts.page', 'd1'), published: doc('page', 'p1')}),
    )
    const published = doc('page', 'p2')

    update(editState({published}))

    expect(post).toHaveBeenCalledExactlyOnceWith(...refreshFor(published))
  })

  test('refreshes with the discarded version when a release version is discarded', () => {
    const published = doc('page', 'p1')
    const version = doc('versions.rSummer.page', 'v1')
    const {post, update} = renderRefresh(editState({published, version}), {releaseId: 'rSummer'})

    update(editState({published}))

    expect(post).toHaveBeenCalledExactlyOnceWith(...refreshFor(version))
  })

  test('refreshes when a document that only exists in a release changes', () => {
    const {post, update} = renderRefresh(editState({version: doc('versions.rSummer.page', 'v1')}), {
      releaseId: 'rSummer',
    })
    const version = doc('versions.rSummer.page', 'v2')

    update(editState({version}))

    expect(post).toHaveBeenCalledExactlyOnceWith(...refreshFor(version))
  })

  test('refreshes once when the document is deleted', () => {
    const draft = doc('drafts.page', 'd1')
    const {post, update} = renderRefresh(editState({draft, published: doc('page', 'p1')}))

    update(editState({}))

    expect(post).toHaveBeenCalledExactlyOnceWith(...refreshFor(draft))
  })

  test('refreshes when a draft that was never published is deleted', () => {
    const draft = doc('drafts.page', 'd1')
    const {post, update} = renderRefresh(editState({draft}))

    update(editState({}))

    expect(post).toHaveBeenCalledExactlyOnceWith(...refreshFor(draft))
  })

  test('refreshes when the first draft of a new document is created', () => {
    const {post, update} = renderRefresh(editState({}))
    const draft = doc('drafts.page', 'd1')

    update(editState({draft}))

    expect(post).toHaveBeenCalledExactlyOnceWith(...refreshFor(draft))
  })

  test('does not refresh when switching to another document', () => {
    const {post, switchDocument} = renderRefresh(
      editState({draft: doc('drafts.page', 'd1'), published: doc('page', 'p1')}),
    )

    switchDocument('other', editState({published: doc('other', 'o1')}))

    expect(post).not.toHaveBeenCalled()
  })

  test('does not refresh when switching from a release to drafts', () => {
    const published = doc('page', 'p1')
    const {post, switchRelease} = renderRefresh(
      editState({published, version: doc('versions.rSummer.page', 'v1')}),
      {releaseId: 'rSummer'},
    )

    switchRelease(undefined, editState({published}))

    expect(post).not.toHaveBeenCalled()
  })

  test('does not refresh when switching between releases', () => {
    const published = doc('page', 'p1')
    const {post, switchRelease} = renderRefresh(
      editState({published, version: doc('versions.rSummer.page', 'v1')}),
      {releaseId: 'rSummer'},
    )

    switchRelease('rWinter', editState({published, version: doc('versions.rWinter.page', 'w1')}))

    expect(post).not.toHaveBeenCalled()
  })

  test('passes livePreviewEnabled through when a document is removed', () => {
    const draft = doc('drafts.page', 'd1')
    const published = doc('page', 'p1')
    const {post, update} = renderRefresh(editState({draft, published}), {
      loadersConnection: 'connected',
    })

    update(editState({published}))

    expect(post).toHaveBeenCalledExactlyOnceWith(...refreshFor(draft, true))
  })
})
