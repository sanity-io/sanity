import {createClient, type MutationEvent, type WelcomeEvent} from '@sanity/client'
import {NEVER, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createDocumentPreviewStore} from '../documentPreviewStore'
import {type InvalidationChannelEvent} from '../types'

const WELCOME: WelcomeEvent = {type: 'welcome', listenerName: 'test'}

function createSpiedClient() {
  const client = createClient({
    projectId: 'abc',
    dataset: 'production',
    apiVersion: '2024-08-27',
    useCdn: false,
  })
  vi.spyOn(client, 'withConfig').mockReturnValue(client)
  const fetch = vi.spyOn(client.observable, 'fetch').mockReturnValue(NEVER)
  const listen = vi.spyOn(client, 'listen').mockReturnValue(NEVER)
  return {client, fetch, listen}
}

describe('createDocumentPreviewStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('follows the global listener store it is given, without opening a listener', async () => {
    const {client, fetch, listen} = createSpiedClient()
    const mutationChannel = new Subject<WelcomeEvent | MutationEvent>()
    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const store = createDocumentPreviewStore({
      client,
      globalListenerStore: {mutationChannel, invalidationChannel},
    })

    const subscriptions = [
      store.unstable_observeDocument('article').subscribe(),
      store.observePaths({_type: 'reference', _ref: 'author'}, ['name']).subscribe(),
    ]
    await vi.advanceTimersByTimeAsync(1_000)
    expect(fetch).not.toHaveBeenCalled()

    mutationChannel.next(WELCOME)
    await vi.advanceTimersByTimeAsync(1_000)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenLastCalledWith(
      '*[_id in $ids]',
      {ids: ['article']},
      {tag: 'preview.observe-document'},
    )

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(1_000)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('"author"'),
      {},
      expect.objectContaining({tag: 'preview.document-paths'}),
    )

    expect(listen).not.toHaveBeenCalled()
    subscriptions.forEach((subscription) => subscription.unsubscribe())
  })

  it('opens a listener of its own when it is not given a global listener store', () => {
    const {client, listen} = createSpiedClient()
    const store = createDocumentPreviewStore({client})

    const subscription = store.unstable_observeDocument('article').subscribe()

    expect(listen).toHaveBeenCalledTimes(1)
    expect(listen).toHaveBeenCalledWith('*', {}, expect.objectContaining({tag: 'preview.global'}))
    subscription.unsubscribe()
  })
})
