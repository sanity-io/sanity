import {createClient, type MutationEvent, type WelcomeEvent} from '@sanity/client'
import {renderHook} from '@testing-library/react'
import {NEVER, Observable, Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {useDocumentPreviewStore, useGlobalListenerStore} from '../datastores'

describe('useDocumentPreviewStore', () => {
  it('shares the workspace global listener instead of opening one of its own', async () => {
    const client = createClient({
      projectId: 'mock-project-id',
      dataset: 'mock-data-set',
      apiVersion: '2024-08-27',
      useCdn: false,
    })
    const server = new Subject<WelcomeEvent | MutationEvent>()
    let connections = 0
    vi.spyOn(client, 'withConfig').mockReturnValue(client)
    vi.spyOn(client.observable, 'fetch').mockReturnValue(NEVER)
    vi.spyOn(client, 'listen').mockReturnValue(
      new Observable<WelcomeEvent | MutationEvent>((subscriber) => {
        connections += 1
        return server.subscribe(subscriber)
      }),
    )
    const wrapper = await createTestProvider({client})

    const {result} = renderHook(
      () => ({
        globalListenerStore: useGlobalListenerStore(),
        previewStore: useDocumentPreviewStore(),
      }),
      {wrapper},
    )
    const {globalListenerStore, previewStore} = result.current
    const subscriptions = [
      globalListenerStore.invalidationChannel.subscribe(),
      previewStore.unstable_observeDocument('article').subscribe(),
    ]

    expect(connections).toBe(1)
    subscriptions.forEach((subscription) => subscription.unsubscribe())
  })
})
