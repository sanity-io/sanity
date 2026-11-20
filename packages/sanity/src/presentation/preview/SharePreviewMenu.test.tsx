import {createClient, type LiveEvent} from '@sanity/client'
import {render, waitFor} from '@testing-library/react'
import {Subject} from 'rxjs'
import {LISTENER_PAUSE_GRACE_PERIOD, listenerGate} from 'sanity'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {stubDocumentVisibility} from '../../../test/testUtils/documentVisibility'
import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {presentationUsEnglishLocaleBundle} from '../i18n'
import {SharePreviewMenu} from './SharePreviewMenu'

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
  const events = new Subject<LiveEvent>()
  vi.spyOn(client.live, 'events').mockReturnValue(events as never)
  const fetch = vi
    .spyOn(client, 'fetch')
    .mockResolvedValue({result: null, syncTags: [], ms: 0, query: ''} as never)
  const TestProvider = await createTestProvider({
    client,
    resources: [presentationUsEnglishLocaleBundle],
  })
  return {TestProvider, events, fetch}
}

function renderMenu(TestProvider: Awaited<ReturnType<typeof setup>>['TestProvider']) {
  return render(
    <TestProvider>
      <SharePreviewMenu
        canToggleSharePreviewAccess
        canUseSharedPreviewAccess
        initialUrl={new URL('https://preview.example/')}
        perspective="drafts"
        previewLocationRoute="/"
        variant={undefined}
      />
    </TestProvider>,
  )
}

describe('SharePreviewMenu', () => {
  it('reads the shared secret again when a page opened in the background is first shown', async () => {
    const {TestProvider, events, fetch} = await setup()
    listenerGate.setEnabled(true)
    const documentVisibility = stubDocumentVisibility('hidden')

    const {unmount} = renderMenu(TestProvider)
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(events.observed).toBe(false)

    documentVisibility.set('visible')
    expect(events.observed).toBe(true)
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    expect(fetch).toHaveBeenLastCalledWith(
      expect.any(String),
      {},
      expect.objectContaining({lastLiveEventId: null}),
    )
    unmount()
  })

  it('stops listening for live events on a hidden page, and reads the shared secret again when shown', async () => {
    const {TestProvider, events, fetch} = await setup()
    vi.useFakeTimers({shouldAdvanceTime: true})
    listenerGate.setEnabled(true)
    const documentVisibility = stubDocumentVisibility()

    const {unmount} = renderMenu(TestProvider)
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(events.observed).toBe(true)

    documentVisibility.set('hidden')
    await vi.advanceTimersByTimeAsync(LISTENER_PAUSE_GRACE_PERIOD)
    expect(events.observed).toBe(false)

    documentVisibility.set('visible')
    expect(events.observed).toBe(true)
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    expect(fetch).toHaveBeenLastCalledWith(
      expect.any(String),
      {},
      expect.objectContaining({lastLiveEventId: null}),
    )
    unmount()
  })
})
