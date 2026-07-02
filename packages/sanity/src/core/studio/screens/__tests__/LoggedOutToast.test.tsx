import {render} from '@testing-library/react'
import {LoggedOutReasonContext, type LoggedOutReason} from 'sanity/_singletons'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {LoggedOutToast} from '../LoggedOutToast'

const useConditionalToast = vi.fn()
vi.mock('../../../hooks/useConditionalToast', () => ({
  useConditionalToast: (params: unknown) => useConditionalToast(params),
}))

beforeEach(() => useConditionalToast.mockClear())
afterEach(() => vi.clearAllMocks())

async function renderWithReason(reason: LoggedOutReason | undefined) {
  const TestProvider = await createTestProvider()
  return render(
    <TestProvider>
      <LoggedOutReasonContext.Provider value={reason}>
        <LoggedOutToast />
      </LoggedOutReasonContext.Provider>
    </TestProvider>,
  )
}

describe('LoggedOutToast', () => {
  test('disables the toast when there is no logged-out reason', async () => {
    await renderWithReason(undefined)
    expect(useConditionalToast).toHaveBeenCalledWith(expect.objectContaining({enabled: false}))
  })

  test('enables a persistent, dismissable session-expired toast', async () => {
    await renderWithReason('session-expired')
    expect(useConditionalToast).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'studio-logged-out',
        enabled: true,
        status: 'info',
        closable: true,
        title: "You've been logged out",
        description: 'Your session expired. Please sign in again.',
      }),
    )
  })

  test('uses the generic copy for a non-expiry reason', async () => {
    // No such reason exists today ('session-expired' is the only member of
    // the union), but the toast keeps a generic fallback so a future reason
    // added without copy still renders something sensible.
    await renderWithReason('some-future-reason' as LoggedOutReason)
    expect(useConditionalToast).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        description: 'Your session is no longer valid. Please sign in again.',
      }),
    )
  })
})
