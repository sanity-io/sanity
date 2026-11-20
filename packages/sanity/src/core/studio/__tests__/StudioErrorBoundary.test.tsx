import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode, useState} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {StudioErrorBoundary} from '../StudioErrorBoundary'

class LimitError extends Error {
  name = 'LimitError'
}

// Throws until told otherwise, so a reset can be observed as the children rendering again
function Thrower({shouldThrow}: {shouldThrow: boolean}): ReactNode {
  if (shouldThrow) throw new LimitError('Document limit exceeded')
  return <div data-testid="recovered" />
}

describe('StudioErrorBoundary', () => {
  // React logs the caught render error itself; keep the test output readable
  const consoleError = vi.spyOn(console, 'error')
  beforeEach(() => consoleError.mockImplementation(() => {}))
  afterEach(() => consoleError.mockClear())

  it('renders the custom screen for an error its owner knows, with a reset that clears the error', async () => {
    const TestProvider = await createTestProvider()
    const getErrorScreen = vi.fn((error: Error, onReset: () => void) =>
      error instanceof LimitError ? (
        <button type="button" data-testid="custom-screen" onClick={onReset}>
          {error.message}
        </button>
      ) : null,
    )

    function Harness() {
      const [shouldThrow, setShouldThrow] = useState(true)
      return (
        <>
          <button type="button" onClick={() => setShouldThrow(false)}>
            fix it
          </button>
          <StudioErrorBoundary heading="The tool crashed" getErrorScreen={getErrorScreen}>
            <Thrower shouldThrow={shouldThrow} />
          </StudioErrorBoundary>
        </>
      )
    }

    render(<Harness />, {wrapper: TestProvider})

    const custom = await screen.findByTestId('custom-screen')
    expect(custom).toHaveTextContent('Document limit exceeded')
    expect(screen.queryByTestId('studio-error-screen')).not.toBeInTheDocument()
    expect(getErrorScreen).toHaveBeenCalledWith(expect.any(LimitError), expect.any(Function))

    // Once the cause is gone, the reset handed to the custom screen renders the children again
    await userEvent.click(screen.getByRole('button', {name: 'fix it'}))
    await userEvent.click(custom)

    expect(await screen.findByTestId('recovered')).toBeInTheDocument()
    expect(screen.queryByTestId('custom-screen')).not.toBeInTheDocument()
  })

  it('renders the generic error screen when the custom screen declines', async () => {
    const TestProvider = await createTestProvider()

    render(
      <StudioErrorBoundary heading="The tool crashed" getErrorScreen={() => null}>
        <Thrower shouldThrow />
      </StudioErrorBoundary>,
      {wrapper: TestProvider},
    )

    expect(await screen.findByTestId('studio-error-screen')).toHaveAttribute(
      'data-error',
      'Document limit exceeded',
    )
    expect(screen.getByText('The tool crashed')).toBeInTheDocument()
  })
})
