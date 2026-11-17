import {act, cleanup, render, screen} from '@testing-library/react'
import {Component, type ReactNode, Suspense} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createRetryableLazy} from './createRetryableLazy'

class Boundary extends Component<{children: ReactNode; onRetry: () => void}, {failed: boolean}> {
  state = {failed: false}

  static getDerivedStateFromError() {
    return {failed: true}
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <button
        onClick={() => {
          this.props.onRetry()
          this.setState({failed: false})
        }}
        type="button"
      >
        retry
      </button>
    )
  }
}

function Loaded({label}: {label: string}) {
  return <p>{label}</p>
}

describe('createRetryableLazy', () => {
  afterEach(() => cleanup())

  it('surfaces a failed load to the error boundary, and loads again on its retry only', async () => {
    const load = vi
      .fn<() => Promise<{default: typeof Loaded}>>()
      .mockRejectedValueOnce(new Error('Failed to fetch dynamically imported module'))
      .mockResolvedValue({default: Loaded})
    const {Component: LazyLoaded, retry} = createRetryableLazy(load)
    // React reports the error it recovers from
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      // The mount suspends on the import
      await act(async () => {
        render(
          <Boundary onRetry={retry}>
            <Suspense fallback={<p>loading</p>}>
              <LazyLoaded label="loaded" />
            </Suspense>
          </Boundary>,
        )
      })
      // The rejection reaches the boundary instead of a new import starting behind the spinner
      expect(await screen.findByText('retry')).toBeTruthy()
      expect(load).toHaveBeenCalledTimes(1)

      // The retry suspends on the import again
      await act(async () => {
        screen.getByText('retry').click()
      })
      expect(await screen.findByText('loaded')).toBeTruthy()
      expect(load).toHaveBeenCalledTimes(2)

      // A load that worked is kept: retrying without a failure does not import again
      retry()
      expect(load).toHaveBeenCalledTimes(2)
    } finally {
      consoleError.mockRestore()
    }
  })
})
