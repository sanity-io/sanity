import {act, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {useReconnectingToast} from '../useReconnectingToast'

const TOAST_TITLE = 'Trying to connect…'

function Reconnecting({isReconnecting}: {isReconnecting: boolean}) {
  useReconnectingToast(isReconnecting)
  return null
}

function setVisibility(state: DocumentVisibilityState) {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state)
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

async function renderReconnecting(isReconnecting = true) {
  const TestProvider = await createTestProvider()
  vi.useFakeTimers({shouldAdvanceTime: true})
  return render(
    <TestProvider>
      <Reconnecting isReconnecting={isReconnecting} />
    </TestProvider>,
  )
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

beforeEach(() => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useReconnectingToast', () => {
  it('tells the user that documents are read-only while reconnecting', async () => {
    await renderReconnecting()

    // The toast waits two seconds, so a short drop goes unnoticed.
    await advance(3_000)

    expect(screen.getByText(TOAST_TITLE)).toBeInTheDocument()
    expect(
      screen.getByText('Documents are read-only until the connection is restored.'),
    ).toBeInTheDocument()
  })

  it('shows nothing while connected', async () => {
    await renderReconnecting(false)

    await advance(3_000)
    expect(screen.queryByText(TOAST_TITLE)).not.toBeInTheDocument()
  })

  it('does not show the toast while the page is hidden', async () => {
    await renderReconnecting()
    setVisibility('hidden')

    await advance(10_000)
    expect(screen.queryByText(TOAST_TITLE)).not.toBeInTheDocument()
  })

  it('starts the delay over when the page is shown again', async () => {
    await renderReconnecting()
    setVisibility('hidden')
    await advance(10_000)

    setVisibility('visible')
    await advance(1_000)
    expect(screen.queryByText(TOAST_TITLE)).not.toBeInTheDocument()

    await advance(2_000)
    expect(screen.getByText(TOAST_TITLE)).toBeInTheDocument()
  })
})
