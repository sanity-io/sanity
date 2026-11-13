import {type SanityClient} from '@sanity/client'
import {act, renderHook, waitFor} from '@testing-library/react'
import {useEffect} from 'react'
import {finalize, NEVER} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {
  comment,
  createAddonDatasetTestClient,
  mutation,
  task,
  WELCOME,
} from '../../../store/addonDatasetListener/__fixtures__/addonDataset.fixture'
import {useAddonDataset} from '../../../studio/addonDataset/useAddonDataset'
import {useAddonDatasetListenerStore} from '../../../studio/addonDataset/useAddonDatasetListenerStore'
import {useTasksStore} from '../../../tasks/store/useTasksStore'
import {useCommentsStore} from '../useCommentsStore'

const transactionsIdMap = new Map<string, string>()
const onLatestTransactionIdReceived = vi.fn((id: string) => {
  transactionsIdMap.delete(id)
})

/** Two documents' comments, a release version's comments and the tasks, as Studio renders them */
function useStores() {
  const {client} = useAddonDataset()
  const listenerStore = useAddonDatasetListenerStore()
  const shared = {client, listenerStore, transactionsIdMap, onLatestTransactionIdReceived}

  return {
    docA: useCommentsStore({...shared, documentId: 'drafts.doc-a'}),
    docB: useCommentsStore({...shared, documentId: 'doc-b'}),
    summerA: useCommentsStore({
      ...shared,
      documentId: 'versions.rSummer.doc-a',
      releaseId: 'rSummer',
    }),
    tasks: useTasksStore({}),
  }
}

function ids(documents: {_id: string}[] | null) {
  return (documents ?? []).map((document) => document._id).toSorted()
}

async function renderConnected(...args: Parameters<typeof createAddonDatasetTestClient>) {
  const testClient = createAddonDatasetTestClient(...args)
  const rendered = renderHook(useStores, {wrapper: testClient.wrapper})

  await act(async () => {
    testClient.server.next(WELCOME)
  })
  await waitFor(() => {
    expect(rendered.result.current.docA.loading).toBe(false)
    expect(rendered.result.current.tasks.isLoading).toBe(false)
  })

  return {...testClient, ...rendered}
}

describe('useCommentsStore', () => {
  it('shares one addon dataset listener with every other comments store and the tasks store', async () => {
    const {result, connections, observableFetch} = await renderConnected({
      comments: [
        comment('c-a', 'doc-a'),
        comment('c-b', 'doc-b'),
        comment('c-summer', 'doc-a', {documentVersionId: 'rSummer'}),
      ],
      tasks: [task('t-1')],
    })

    expect(connections.opened).toBe(1)
    expect(observableFetch).toHaveBeenCalledTimes(4)
    expect(ids(result.current.docA.data)).toEqual(['c-a'])
    expect(ids(result.current.docB.data)).toEqual(['c-b'])
    expect(ids(result.current.summerA.data)).toEqual(['c-summer'])
    expect(ids(result.current.tasks.data)).toEqual(['t-1'])
  })

  it('keeps only the comments for its own document and release, and none of the tasks', async () => {
    const {result, server} = await renderConnected({})

    await act(async () => {
      server.next(mutation('appear', 'c-b', comment('c-b', 'doc-b')))
      server.next(
        mutation(
          'appear',
          'c-summer',
          comment('c-summer', 'doc-a', {documentVersionId: 'rSummer'}),
        ),
      )
      server.next(mutation('appear', 't-1', task('t-1')))
    })

    expect(ids(result.current.docA.data)).toEqual([])
    expect(ids(result.current.docB.data)).toEqual(['c-b'])
    expect(ids(result.current.summerA.data)).toEqual(['c-summer'])
    expect(ids(result.current.tasks.data)).toEqual(['t-1'])

    const tasksData = result.current.tasks.data
    await act(async () => {
      server.next(mutation('disappear', 'c-b'))
    })
    expect(ids(result.current.docB.data)).toEqual([])
    expect(result.current.tasks.data).toBe(tasksData)
  })

  it('drops a comment that an edit moves out of its query', async () => {
    const {result, server} = await renderConnected({comments: [comment('c-a', 'doc-a')]})
    expect(ids(result.current.docA.data)).toEqual(['c-a'])

    await act(async () => {
      server.next(
        mutation('update', 'c-a', comment('c-a', 'doc-a', {documentVersionId: 'rSummer'})),
      )
    })

    expect(ids(result.current.docA.data)).toEqual([])
    expect(ids(result.current.summerA.data)).toEqual(['c-a'])
  })

  it('removes a deleted comment with its replies, and leaves the other stores as they are', async () => {
    const {result, server} = await renderConnected({
      comments: [comment('c-a', 'doc-a'), comment('reply', 'doc-a', {parentCommentId: 'c-a'})],
      tasks: [task('t-1')],
    })
    const docBData = result.current.docB.data
    const tasksData = result.current.tasks.data

    await act(async () => {
      server.next(mutation('disappear', 'c-a'))
    })

    expect(ids(result.current.docA.data)).toEqual([])
    expect(result.current.docB.data).toBe(docBData)
    expect(result.current.tasks.data).toBe(tasksData)
  })

  it('does not let an older transaction overwrite a newer one', async () => {
    const {result, server} = await renderConnected({comments: [comment('c-a', 'doc-a')]})
    transactionsIdMap.set('c-a', 'tx-2')

    await act(async () => {
      server.next(mutation('update', 'c-a', comment('c-a', 'doc-a', {status: 'resolved'}), 'tx-1'))
    })
    expect(result.current.docA.data?.[0]?.status).toBe('open')
    expect(onLatestTransactionIdReceived).not.toHaveBeenCalled()

    await act(async () => {
      server.next(mutation('update', 'c-a', comment('c-a', 'doc-a', {status: 'resolved'}), 'tx-2'))
    })
    expect(result.current.docA.data?.[0]?.status).toBe('resolved')
    expect(onLatestTransactionIdReceived).toHaveBeenCalledWith('c-a')
  })

  it('shows optimistic updates, and applies the listener’s changes on top of them', async () => {
    const {result, server} = await renderConnected({})

    act(() => {
      result.current.docA.dispatch({type: 'COMMENT_ADDED', payload: comment('c-new', 'doc-a')})
    })
    expect(ids(result.current.docA.data)).toEqual(['c-new'])

    await act(async () => {
      server.next(mutation('update', 'c-new', comment('c-new', 'doc-a', {status: 'resolved'})))
    })
    expect(result.current.docA.data?.[0]?.status).toBe('resolved')
  })
})

describe('useCommentsStore, when its release changes', () => {
  it('cancels the previous fetch, and never shows the previous comments', async () => {
    const testClient = createAddonDatasetTestClient({
      comments: [
        comment('c-a', 'doc-a'),
        comment('c-summer', 'doc-a', {documentVersionId: 'rSummer'}),
      ],
    })
    const commits: {ids: string[]; loading: boolean}[] = []
    const {result, rerender} = renderHook(
      ({releaseId}: {releaseId?: 'rSummer'}) => {
        const {client} = useAddonDataset()
        const listenerStore = useAddonDatasetListenerStore()
        const store = useCommentsStore({
          client,
          listenerStore,
          transactionsIdMap,
          onLatestTransactionIdReceived,
          documentId: 'doc-a',
          releaseId,
        })
        useEffect(() => {
          commits.push({ids: ids(store.data), loading: store.loading})
        })
        return store
      },
      {wrapper: testClient.wrapper, initialProps: {}},
    )
    await act(async () => {
      testClient.server.next(WELCOME)
    })
    await waitFor(() => expect(ids(result.current.data)).toEqual(['c-a']))

    // The release's fetch stays in flight until the store switches away from it
    let releaseFetchCancelled = false
    testClient.observableFetch.mockImplementationOnce((() =>
      NEVER.pipe(
        finalize(() => {
          releaseFetchCancelled = true
        }),
      )) as SanityClient['observable']['fetch'])
    const commitsBeforeSwitch = commits.length
    rerender({releaseId: 'rSummer'})
    const switchCommits = commits.slice(commitsBeforeSwitch)
    expect(switchCommits[0]).toEqual({ids: [], loading: true})
    expect(switchCommits).not.toContainEqual(expect.objectContaining({ids: ['c-a']}))

    rerender({})
    await waitFor(() => expect(releaseFetchCancelled).toBe(true))
    await waitFor(() => expect(ids(result.current.data)).toEqual(['c-a']))
    expect(result.current.loading).toBe(false)
  })
})
