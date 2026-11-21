import {act, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {useReconnectingToast} from '../useReconnectingToast'

function ReconnectingToast(props: {isReconnecting: boolean}) {
  useReconnectingToast(props.isReconnecting)
  return null
}

describe('useReconnectingToast', () => {
  let TestProvider: Awaited<ReturnType<typeof createTestProvider>>

  beforeEach(async () => {
    TestProvider = await createTestProvider()
    vi.useFakeTimers({shouldAdvanceTime: true})
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('tells the user that documents are read-only while reconnecting', async () => {
    render(
      <TestProvider>
        <ReconnectingToast isReconnecting />
      </TestProvider>,
    )

    // The toast waits two seconds, so a short drop goes unnoticed.
    await act(() => vi.advanceTimersByTimeAsync(3_000))

    expect(screen.getByText('Trying to connect…')).toBeInTheDocument()
    expect(
      screen.getByText('Documents are read-only until the connection is restored.'),
    ).toBeInTheDocument()
  })

  it('shows nothing while connected', async () => {
    render(
      <TestProvider>
        <ReconnectingToast isReconnecting={false} />
      </TestProvider>,
    )

    await act(() => vi.advanceTimersByTimeAsync(3_000))

    expect(screen.queryByText('Trying to connect…')).not.toBeInTheDocument()
  })
})
