import {type ListenEvent} from '@sanity/client'
import {act, renderHook, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {stubDocumentVisibility} from '../../../../test/testUtils/documentVisibility'
import {useCommentsStore} from '../../comments/store/useCommentsStore'
import {LISTENER_RESET_DELAY} from '../../preview/constants'
import {useAddonDataset} from '../../studio/addonDataset/useAddonDataset'
import {useAddonDatasetListenerStore} from '../../studio/addonDataset/useAddonDatasetListenerStore'
import {useTasksStore} from '../../tasks/store/useTasksStore'
import {LISTENER_PAUSE_GRACE_PERIOD, listenerGate} from '../listenerGate/listenerGate'
import {
  comment,
  createAddonDatasetTestClient,
  task,
  WELCOME,
} from './__fixtures__/addonDataset.fixture'
import {
  type AddonDatasetDocument,
  createAddonDatasetListenerStore,
} from './createAddonDatasetListenerStore'

// Stable across renders, as the comments provider passes them
const transactionsIdMap = new Map<string, string>()
const onLatestTransactionIdReceived = () => undefined

beforeEach(() => {
  vi.useFakeTimers({shouldAdvanceTime: true})
  listenerGate.setEnabled(true)
})

afterEach(() => {
  vi.advanceTimersByTime(LISTENER_RESET_DELAY)
  listenerGate.setEnabled(false)
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('createAddonDatasetListenerStore while the page is hidden', () => {
  it('disconnects, tells subscribers it is reconnecting, and connects again when shown', () => {
    const documentVisibility = stubDocumentVisibility()
    const {client, server, connections} = createAddonDatasetTestClient({})
    const store = createAddonDatasetListenerStore({client})
    const events: ListenEvent<AddonDatasetDocument>['type'][] = []
    const subscription = store.events.subscribe((event) => events.push(event.type))
    server.next(WELCOME)

    documentVisibility.set('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    expect(events).toEqual(['welcome', 'reconnect'])

    // Late subscribers get the pause, not the stale welcome
    const late: string[] = []
    const lateSubscription = store.events.subscribe((event) => late.push(event.type))
    expect(late).toEqual(['reconnect'])

    documentVisibility.set('visible')
    expect(connections.opened).toBe(2)
    server.next(WELCOME)
    expect(events).toEqual(['welcome', 'reconnect', 'welcome'])
    expect(late).toEqual(['reconnect', 'welcome'])

    subscription.unsubscribe()
    lateSubscription.unsubscribe()
  })

  it('refetches the comments and the tasks once the page is shown again', async () => {
    const documentVisibility = stubDocumentVisibility()
    const documents = {comments: [comment('c1', 'doc-a')], tasks: [task('t1')]}
    const testClient = createAddonDatasetTestClient(documents)
    const {result} = renderHook(
      () => {
        const {client} = useAddonDataset()
        const listenerStore = useAddonDatasetListenerStore()
        return {
          comments: useCommentsStore({
            client,
            listenerStore,
            documentId: 'doc-a',
            transactionsIdMap,
            onLatestTransactionIdReceived,
          }),
          tasks: useTasksStore({}),
        }
      },
      {wrapper: testClient.wrapper},
    )
    await act(async () => testClient.server.next(WELCOME))
    await waitFor(() => expect(result.current.comments.loading).toBe(false))

    act(() => documentVisibility.set('hidden'))
    await act(() => vi.advanceTimersByTimeAsync(LISTENER_PAUSE_GRACE_PERIOD))
    expect(result.current.comments.loading).toBe(true)
    expect(result.current.tasks.isLoading).toBe(true)

    // Changes the closed listener never reports
    documents.comments.push(comment('c2', 'doc-a'))
    documents.tasks.push(task('t2'))

    act(() => documentVisibility.set('visible'))
    await act(async () => testClient.server.next(WELCOME))
    await waitFor(() => {
      expect(result.current.comments.loading).toBe(false)
      expect(result.current.tasks.isLoading).toBe(false)
    })
    expect(testClient.connections.opened).toBe(2)
    expect(result.current.comments.data).toHaveLength(2)
    expect(result.current.tasks.data).toHaveLength(2)
  })
})
