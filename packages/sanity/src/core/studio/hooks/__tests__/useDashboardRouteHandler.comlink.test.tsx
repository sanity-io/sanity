import {createController} from '@sanity/comlink'
import {type Bridge, type PathChangeMessage} from '@sanity/message-protocol'
import {ResourceProvider} from '@sanity/sdk-react'
import {render, waitFor} from '@testing-library/react'
import {createBrowserHistory} from 'history'
import {route, RouterProvider} from 'sanity/router'
import {expect, it, onTestFinished, vi} from 'vitest'

import {ResourceCacheProvider} from '../../../store/ResourceCacheProvider'
import {DashboardRouteHandler} from '../../components/DashboardRouteHandler'
import {RouterHistoryProvider} from '../../router/RouterHistoryContext'

// The Dashboard's `_context` param, read when the rendering context module loads.
vi.hoisted(() => {
  window.history.replaceState(
    null,
    '',
    `/test/structure?_context=${encodeURIComponent(JSON.stringify({mode: 'core-ui', env: 'test'}))}`,
  )
})

it("pushes the Dashboard's change-path over Comlink, whatever its type", async () => {
  // Comlink needs Studio to be rendered in a frame; jsdom's parent is the window itself.
  vi.spyOn(window, 'top', 'get').mockReturnValue(null)
  // jsdom's `postMessage` takes no options object and leaves `source` unset, which Comlink needs.
  const posted: unknown[] = []
  const deliveries = new Set<Promise<void>>()
  vi.spyOn(window, 'postMessage').mockImplementation((data: unknown) => {
    posted.push(data)
    const delivery = new Promise<void>((resolve) =>
      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent('message', {data, origin: location.origin, source: window}),
        )
        resolve()
      }),
    )
    deliveries.add(delivery)
    void delivery.then(() => deliveries.delete(delivery))
  })
  const controller = createController({targetOrigin: '*'})
  controller.addTarget(window)
  const channel = controller.createChannel<
    PathChangeMessage,
    Bridge.Listeners.History.UpdateURLMessage
  >({
    name: 'dashboard/channels/sdk',
    connectTo: 'dashboard/nodes/sdk',
  })
  const reports: Array<{url: string}> = []
  channel.on('dashboard/v1/bridge/listeners/history/update-url', (data) => {
    reports.push(data)
    return {success: true}
  })
  // Vitest restores the `postMessage` spy once the file ends, and jsdom's own implementation throws
  // on Comlink's options object. Comlink sends its disconnect after `destroy()` returns, so wait for
  // it, and for every delivery, before the test lets go of the window.
  onTestFinished(async () => {
    controller.destroy()
    await vi.waitFor(() =>
      expect(posted).toContainEqual(expect.objectContaining({type: 'comlink/disconnect'})),
    )
    while (deliveries.size) await Promise.all(deliveries)
  })

  const history = createBrowserHistory()
  const navigations: Array<{path: string; replace?: boolean}> = []
  render(
    <ResourceCacheProvider>
      <ResourceProvider projectId="test" dataset="test" fallback={null}>
        <RouterHistoryProvider history={history}>
          <RouterProvider
            router={route.create('/')}
            state={{}}
            onNavigate={(navigation) => navigations.push(navigation)}
          >
            <DashboardRouteHandler />
          </RouterProvider>
        </RouterHistoryProvider>
      </ResourceProvider>
    </ResourceCacheProvider>,
  )

  channel.start()
  channel.post('dashboard/v1/history/change-path', {
    path: '//test/structure/book;book-1',
    type: 'replace',
  })

  await waitFor(() =>
    expect(navigations).toEqual([{path: '/test/structure/book;book-1', replace: false}]),
  )
  // The bridge reports Studio's URL to the Dashboard, so Studio reports nothing itself.
  expect(reports).toEqual([])
})
