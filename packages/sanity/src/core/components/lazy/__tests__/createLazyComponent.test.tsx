import {render, screen} from '@testing-library/react'
import {Component, type ComponentType, type ReactNode} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createLazyComponent} from '../createLazyComponent'

function createDeferredLoad<TProps extends object>() {
  let resolve!: (component: ComponentType<TProps>) => void
  let reject!: (reason: Error) => void

  const promise = new Promise<ComponentType<TProps>>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  return {load: () => promise, resolve, reject}
}

class ErrorBoundary extends Component<{children: ReactNode}, {message?: string}> {
  state: {message?: string} = {}

  static getDerivedStateFromError(error: Error) {
    return {message: error.message}
  }

  render() {
    if (this.state.message) {
      return <span data-testid="error">{this.state.message}</span>
    }
    return this.props.children
  }
}

describe('createLazyComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the fallback until the implementation resolves, then the implementation', async () => {
    const {load, resolve} = createDeferredLoad<{label: string}>()
    const Lazy = createLazyComponent(load, <span data-testid="fallback" />)

    render(<Lazy label="loaded" />)

    expect(screen.getByTestId('fallback')).toBeInTheDocument()

    resolve(({label}) => <span data-testid="implementation">{label}</span>)

    expect(await screen.findByTestId('implementation')).toHaveTextContent('loaded')
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument()
  })

  it('renders nothing while loading when no fallback is given', async () => {
    const {load, resolve} = createDeferredLoad()
    const Lazy = createLazyComponent(load)

    const {container} = render(<Lazy />)

    expect(container).toBeEmptyDOMElement()

    resolve(() => <span data-testid="implementation" />)

    expect(await screen.findByTestId('implementation')).toBeInTheDocument()
  })

  it('surfaces a failed load to the nearest error boundary', async () => {
    // React logs the caught error to the console; it is the assertion below that matters.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const {load, reject} = createDeferredLoad()
    const Lazy = createLazyComponent(load, <span data-testid="fallback" />)

    render(
      <ErrorBoundary>
        <Lazy />
      </ErrorBoundary>,
    )

    expect(screen.getByTestId('fallback')).toBeInTheDocument()

    reject(new Error('Failed to fetch dynamically imported module'))

    expect(await screen.findByTestId('error')).toHaveTextContent(
      'Failed to fetch dynamically imported module',
    )
  })

  it('loads the implementation once and reuses it across renders', async () => {
    const {load, resolve} = createDeferredLoad()
    const spy = vi.fn(load)
    const Lazy = createLazyComponent(spy)

    const {rerender} = render(<Lazy />)
    rerender(<Lazy />)

    resolve(() => <span data-testid="implementation" />)
    await screen.findByTestId('implementation')

    rerender(<Lazy />)

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
