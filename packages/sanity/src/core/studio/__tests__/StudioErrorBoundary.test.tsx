import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {StudioErrorBoundary} from '../StudioErrorBoundary'

vi.mock('use-hot-module-reload', () => ({
  useHotModuleReload: vi.fn(),
}))

const mockClipboardWriteText = vi.fn<(text: string) => Promise<void>>()

/**
 * Mirrors the `DOMException`s that `@sanity/client` and `get-it` reject aborted and timed-out
 * requests with (`new DOMException(reason, 'AbortError')` /
 * `new DOMException('The operation was aborted due to timeout', 'TimeoutError')`). In browsers a
 * `DOMException` has no own properties: `name`, `message` and `code` are prototype accessors,
 * and unlike Node/jsdom there is no own `stack` either.
 */
function createBrowserLikeDOMException(message: string, name: string): DOMException {
  const error = new DOMException(message, name)
  Reflect.deleteProperty(error, 'stack')
  return error
}

/**
 * Throws from render the way `react-rx` surfaces an errored observable (`useSyncObservable` /
 * `useObservable` rethrow the observable's error during render), which is how a failed
 * `@sanity/client` request inside `DocumentPaneProvider` reaches the studio's error boundaries.
 */
function ThrowOnRender({error}: {error: unknown}): ReactNode {
  throw error
}

async function copyErrorDetailsFor(error: unknown): Promise<unknown> {
  const TestProvider = await createTestProvider()

  render(
    <TestProvider>
      <StudioErrorBoundary>
        <ThrowOnRender error={error} />
      </StudioErrorBoundary>
    </TestProvider>,
  )

  expect(screen.getByTestId('studio-error-screen')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', {name: 'Copy error details'}))
  await waitFor(() => expect(mockClipboardWriteText).toHaveBeenCalledTimes(1))

  return JSON.parse(mockClipboardWriteText.mock.calls[0][0])
}

describe('StudioErrorBoundary', () => {
  beforeEach(() => {
    // React logs errors caught by boundaries to console.error
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockClipboardWriteText.mockResolvedValue(undefined)
    Object.assign(navigator, {clipboard: {writeText: mockClipboardWriteText}})
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('copy error details', () => {
    it('includes the message of a plain Error', async () => {
      const details = await copyErrorDetailsFor(new Error('Something broke'))

      expect(details).toMatchObject({error: {message: 'Something broke'}})
    })

    // Regression test for a customer report: the Structure tool crashed and the only thing the
    // user could share from the fallback screen was `{"error": {}}`. The production fallback
    // screen does not print the message, so the copied details must identify the error.
    it.each([
      ['AbortError', 'The operation was aborted.'],
      ['TimeoutError', 'The operation was aborted due to timeout'],
    ])(
      'includes the name and message of a %s thrown by an aborted or timed-out request',
      async (name, message) => {
        const details = await copyErrorDetailsFor(createBrowserLikeDOMException(message, name))

        expect(details).toMatchObject({error: {name, message}})
      },
    )
  })
})
