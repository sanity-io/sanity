import {ChannelError} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {getMeasuredApiProtocol} from '../../../network/isUsingLegacyHttp'
import type * as IsUsingLegacyHttpExports from '../../../network/isUsingLegacyHttp'
import {startTrackingStudioTabs} from '../../../network/studioTabs'
import {RequestErrorDialog} from '../RequestErrorDialog'

vi.mock('../../../network/isUsingLegacyHttp', async (importOriginal) => ({
  ...(await importOriginal<typeof IsUsingLegacyHttpExports>()),
  getMeasuredApiProtocol: vi.fn(),
}))

const TABS_TIP = 'Try closing other Studio tabs.'
const SCOPE = 'api.sanity.io'

function stubLocks(query: () => Promise<{held: {name: string}[]}>) {
  vi.stubGlobal('navigator', {
    ...navigator,
    locks: {request: () => new Promise(() => undefined), query},
  })
}

async function renderNetworkError() {
  const TestProvider = await createTestProvider()
  render(
    <TestProvider>
      <RequestErrorDialog
        claim={{type: 'networkError', error: new Error('Failed to fetch'), retryable: true}}
        onRetry={() => {}}
      />
    </TestProvider>,
  )
  await screen.findByRole('dialog')
  await flushMicrotasksThisIsACodeSmell()
}

describe('RequestErrorDialog', () => {
  it('reports a listener that failed irrecoverably as a lost connection, with reload as the only way out', async () => {
    const TestProvider = await createTestProvider()
    const error = new ChannelError('Permission denied', {
      error: {type: 'permissionDeniedError', description: 'Permission denied'},
    })

    render(
      <TestProvider>
        <RequestErrorDialog
          claim={{type: 'listenerError', error, retryable: false}}
          onRetry={() => {}}
        />
      </TestProvider>,
    )

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Connection error')
    expect(dialog).toHaveTextContent(
      "The Studio lost its live connection to Sanity and couldn't restore it. Content won't update live, and documents are read-only, until you reload the Studio.",
    )
    expect(screen.getByRole('link', {name: /Check Sanity Status/})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Reload Studio'})).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Try again'})).not.toBeInTheDocument()
  })

  describe('closing other tabs tip', () => {
    let stopTracking: () => void

    beforeEach(() => {
      vi.mocked(getMeasuredApiProtocol).mockReturnValue(undefined)
    })

    afterEach(() => {
      stopTracking?.()
      vi.unstubAllGlobals()
    })

    it('is hidden when the open tabs are far below the listener limit', async () => {
      stubLocks(async () => ({held: [{name: `sanity-listener-tab:${SCOPE}:peer-tab:5`}]}))
      stopTracking = startTrackingStudioTabs(SCOPE)

      await renderNetworkError()

      await waitFor(() => expect(screen.queryByText(TABS_TIP)).not.toBeInTheDocument())
    })

    it('is shown when there is no tracked scope', async () => {
      await renderNetworkError()

      expect(screen.getByText(TABS_TIP)).toBeInTheDocument()
    })

    it('is shown when the open tabs cannot be read', async () => {
      stubLocks(() => Promise.reject(new Error('blocked')))
      stopTracking = startTrackingStudioTabs(SCOPE)

      await renderNetworkError()

      expect(screen.getByText(TABS_TIP)).toBeInTheDocument()
    })

    it('is shown when the connection is HTTP/1.x', async () => {
      vi.mocked(getMeasuredApiProtocol).mockReturnValue('http/1.1')
      stubLocks(async () => ({held: [{name: `sanity-listener-tab:${SCOPE}:peer-tab:5`}]}))
      stopTracking = startTrackingStudioTabs(SCOPE)

      await renderNetworkError()

      expect(screen.getByText(TABS_TIP)).toBeInTheDocument()
    })
  })
})
