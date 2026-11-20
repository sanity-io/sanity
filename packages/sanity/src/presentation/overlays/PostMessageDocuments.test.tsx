import {createClient} from '@sanity/client'
import {createController} from '@sanity/comlink'
import {
  type VisualEditingControllerMsg,
  type VisualEditingNodeMsg,
} from '@sanity/presentation-comlink'
import {render} from '@testing-library/react'
import {Observable} from 'rxjs'
import {LISTENER_PAUSE_GRACE_PERIOD, listenerGate} from 'sanity'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {stubDocumentVisibility} from '../../../test/testUtils/documentVisibility'
import {createTestProvider} from '../../../test/testUtils/TestProvider'
import PostMessageDocuments from './PostMessageDocuments'

afterEach(() => {
  listenerGate.setEnabled(false)
  vi.useRealTimers()
  vi.restoreAllMocks()
})

async function setup() {
  const client = createClient({
    projectId: 'abc',
    dataset: 'production',
    apiVersion: '2025-02-19',
    useCdn: false,
  })
  // `useClient` configures the workspace client with `withConfig`, keep it this spied instance
  vi.spyOn(client, 'withConfig').mockReturnValue(client)
  const connections = {opened: 0, open: 0}
  vi.spyOn(client, 'listen').mockImplementation(
    () =>
      new Observable((subscriber) => {
        connections.opened++
        connections.open++
        subscriber.next({
          type: 'welcome',
          listenerName: `presentation-documents-${connections.opened}`,
        })
        return () => {
          connections.open--
        }
      }) as never,
  )
  // A channel that never connects to a preview: what the component posts is recorded, not sent
  const comlink = createController({targetOrigin: 'https://preview.example'}).createChannel<
    VisualEditingControllerMsg,
    VisualEditingNodeMsg
  >({name: 'presentation', connectTo: 'visual-editing'})
  const post = vi.spyOn(comlink, 'post').mockImplementation(() => undefined)
  const posted = () =>
    post.mock.calls.flatMap(([type, data]) =>
      type === 'presentation/snapshot-event' && data && 'event' in data ? [data.event.type] : [],
    )
  // Calls a handler the component registers, the way a visual editing context's request would
  const on = vi.spyOn(comlink, 'on')
  const request = (type: string): Promise<unknown> => {
    const handler = on.mock.calls.findLast(([registered]) => registered === type)?.[1]
    if (!handler) throw new Error(`No handler registered for ${type}`)
    return Promise.resolve((handler as (data: unknown) => unknown)(undefined))
  }
  const TestProvider = await createTestProvider({client})
  vi.useFakeTimers()
  listenerGate.setEnabled(true)
  const documentVisibility = stubDocumentVisibility()

  const {unmount} = render(
    <TestProvider>
      <PostMessageDocuments comlink={comlink} perspective="drafts" variant={undefined} />
    </TestProvider>,
  )

  return {
    connections,
    documentVisibility,
    posted,
    request,
    cleanup: () => {
      unmount()
      comlink.stop()
    },
  }
}

describe('PostMessageDocuments', () => {
  it('posts a reconnect when its listeners pause on a hidden page, and a new welcome when shown', async () => {
    const {connections, documentVisibility, posted, cleanup} = await setup()
    const openWhileVisible = connections.open
    expect(openWhileVisible).toBeGreaterThan(0)
    expect(posted()).toEqual(['welcome'])

    documentVisibility.set('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    expect(connections.open).toBe(0)
    expect(posted()).toEqual(['welcome', 'reconnect'])

    documentVisibility.set('visible')
    expect(connections.open).toBe(openWhileVisible)
    expect(posted()).toEqual(['welcome', 'reconnect', 'welcome'])
    cleanup()
  })

  it('answers a welcome request made while paused with the welcome of the next connection', async () => {
    const {documentVisibility, request, cleanup} = await setup()
    await expect(request('visual-editing/snapshot-welcome')).resolves.toMatchObject({
      event: {type: 'welcome', listenerName: 'presentation-documents-1'},
    })

    documentVisibility.set('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    let answer: unknown
    void request('visual-editing/snapshot-welcome').then((result) => {
      answer = result
    })
    await vi.advanceTimersByTimeAsync(0)
    // The paused connection's welcome is stale: a context that fetched its snapshots on it
    // would miss every mutation made until the page is shown again
    expect(answer).toBeUndefined()

    documentVisibility.set('visible')
    await vi.advanceTimersByTimeAsync(0)
    expect(answer).toMatchObject({event: {type: 'welcome'}})
    expect(answer).not.toMatchObject({event: {listenerName: 'presentation-documents-1'}})
    cleanup()
  })
})
