import {ResourceProvider} from '@sanity/sdk-react'
import {type PayloadOf} from '@sanity/sdk/dashboard'
import {act, render, screen, waitFor} from '@testing-library/react'
import {createBrowserHistory} from 'history'
import {type ReactNode} from 'react'
import {route, RouterProvider} from 'sanity/router'
import {beforeEach, expect, it} from 'vitest'

import {stubMessageBusHost} from '../../../../../test/testUtils/stubMessageBusHost'
import {ResourceCacheProvider} from '../../../store/ResourceCacheProvider'
import {DashboardRouteHandler} from '../../components/DashboardRouteHandler'
import {RouterHistoryProvider} from '../../router/RouterHistoryContext'
import {type RouterHistory} from '../../router/types'

const STUDIO_URL = '/studios/studio/test/structure'

beforeEach(() => {
  window.history.replaceState(null, '', STUDIO_URL)
})

function StudioRouter({history, children}: {history: RouterHistory; children: ReactNode}) {
  return (
    <RouterHistoryProvider history={history}>
      <RouterProvider
        router={route.create('/')}
        state={{}}
        onNavigate={({path, replace}) => (replace ? history.replace(path) : history.push(path))}
      >
        {children}
      </RouterProvider>
    </RouterHistoryProvider>
  )
}

// A message bus host that records Studio's navigation reports and accepts them.
function renderWithMessageBusHost() {
  const host = stubMessageBusHost()
  const reports: PayloadOf<'navigation.location.update'>[] = []
  host.respond('navigation.location.update', (message) => {
    reports.push(message.payload)
    message.reply({ok: true})
  })

  const history = createBrowserHistory()
  render(
    <ResourceCacheProvider>
      <ResourceProvider projectId="test" dataset="test" fallback={null}>
        <StudioRouter history={history}>
          <DashboardRouteHandler />
        </StudioRouter>
      </ResourceProvider>
    </ResourceCacheProvider>,
  )
  return {host, history, reports}
}

it("reports Studio's URL to a message bus host as a replace", async () => {
  const {history, reports} = renderWithMessageBusHost()
  await waitFor(() => expect(reports).toEqual([{url: STUDIO_URL, history: 'replace'}]))

  act(() => history.push(`${STUDIO_URL}/book;book-1?perspective=drafts`))

  await waitFor(() =>
    expect(reports).toEqual([
      {url: STUDIO_URL, history: 'replace'},
      {url: `${STUDIO_URL}/book;book-1?perspective=drafts`, history: 'replace'},
    ]),
  )
})

it('reports back and forward to a message bus host without adding history entries', async () => {
  const {history, reports} = renderWithMessageBusHost()
  await waitFor(() => expect(reports).toHaveLength(1))
  const documentUrl = `${STUDIO_URL}/book;book-1`
  act(() => history.push(documentUrl))
  await waitFor(() => expect(reports).toHaveLength(2))
  const entries = window.history.length

  act(() => history.back())
  await waitFor(() => expect(reports.at(-1)).toEqual({url: STUDIO_URL, history: 'replace'}))
  act(() => history.forward())
  await waitFor(() => expect(reports.at(-1)).toEqual({url: documentUrl, history: 'replace'}))

  expect(window.history.length).toBe(entries)
})

it("follows a message bus host's navigation without adding a history entry", async () => {
  const {host, history, reports} = renderWithMessageBusHost()
  await waitFor(() => expect(reports).toHaveLength(1))

  // The host pushes onto the browser history it shares with Studio, then commits the location.
  const hostUrl = `${STUDIO_URL}/book;book-2`
  window.history.pushState(null, '', hostUrl)
  const entries = window.history.length
  const to = {appId: 'studio', path: 'test/structure/book;book-2'}
  act(() => host.publish('navigation.location', {...to, transition: {navigationType: 'push', to}}))
  act(() => host.publish('navigation.location', {...to, transition: null}))

  await waitFor(() => expect(history.location.pathname).toBe(hostUrl))
  expect(window.history.length).toBe(entries)
})

it("ignores the host echoing Studio's own report", async () => {
  const {host, history, reports} = renderWithMessageBusHost()
  await waitFor(() => expect(reports).toHaveLength(1))

  act(() => history.push(`${STUDIO_URL}/book;book-1`))
  await waitFor(() => expect(reports).toHaveLength(2))
  const entries = window.history.length

  // The host commits Studio's report, then navigates Studio somewhere else.
  const own = {appId: 'studio', path: 'test/structure/book;book-1'}
  act(() =>
    host.publish('navigation.location', {...own, transition: {navigationType: 'replace', to: own}}),
  )
  act(() => host.publish('navigation.location', {...own, transition: null}))
  const hostUrl = `${STUDIO_URL}/book;book-3`
  window.history.pushState(null, '', hostUrl)
  const to = {appId: 'studio', path: 'test/structure/book;book-3'}
  act(() => host.publish('navigation.location', {...to, transition: {navigationType: 'push', to}}))
  act(() => host.publish('navigation.location', {...to, transition: null}))

  await waitFor(() => expect(history.location.pathname).toBe(hostUrl))
  expect(reports).toHaveLength(3)
  expect(window.history.length).toBe(entries + 1)
})

it('renders Studio without a dashboard host', () => {
  render(
    <ResourceCacheProvider>
      <ResourceProvider projectId="test" dataset="test" fallback={null}>
        <StudioRouter history={createBrowserHistory()}>
          <DashboardRouteHandler />
          <p>Studio</p>
        </StudioRouter>
      </ResourceProvider>
    </ResourceCacheProvider>,
  )

  expect(screen.getByText('Studio')).toBeVisible()
})
