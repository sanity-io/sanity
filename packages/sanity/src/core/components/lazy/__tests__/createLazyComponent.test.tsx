import {render, screen} from '@testing-library/react'
import {Component, type ComponentType, type ReactNode, Suspense} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createLazyComponent} from '../createLazyComponent'

function createDeferredLoad<TProps extends object>() {
  let resolve!: (component: ComponentType<TProps>) => void
  let reject!: (reason: Error) => void

  const promise = new Promise<{default: ComponentType<TProps>}>((_resolve, _reject) => {
    resolve = (component) => _resolve({default: component})
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

  it('renders its own fallback until the implementation resolves, then the implementation', async () => {
    const {load, resolve} = createDeferredLoad<{label: string}>()
    const Lazy = createLazyComponent(load, {fallback: <span data-testid="fallback" />})

    render(<Lazy label="loaded" />)

    expect(screen.getByTestId('fallback')).toBeInTheDocument()

    resolve(({label}) => <span data-testid="implementation">{label}</span>)

    expect(await screen.findByTestId('implementation')).toHaveTextContent('loaded')
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument()
  })

  it('suspends to the nearest ancestor boundary when no fallback is given', async () => {
    const {load, resolve} = createDeferredLoad()
    const Lazy = createLazyComponent(load)

    render(
      <Suspense fallback={<span data-testid="ancestor-fallback" />}>
        <Lazy />
      </Suspense>,
    )

    // No boundary of its own, so the ancestor's fallback is what shows. Form nodes rely on this:
    // a boundary here would catch a suspending descendant and unmount the subtree around it.
    expect(screen.getByTestId('ancestor-fallback')).toBeInTheDocument()

    resolve(() => <span data-testid="implementation" />)

    expect(await screen.findByTestId('implementation')).toBeInTheDocument()
  })

  it('renders synchronously once the implementation has loaded', async () => {
    const {load, resolve} = createDeferredLoad()
    const Lazy = createLazyComponent(load)

    const {unmount} = render(
      <Suspense fallback={<span data-testid="ancestor-fallback" />}>
        <Lazy />
      </Suspense>,
    )
    resolve(() => <span data-testid="implementation" />)
    await screen.findByTestId('implementation')
    unmount()

    // A second mount must not flash the fallback. `React.lazy` would: it calls the loader again
    // and `import()` hands back a fresh pending promise even for a module already in the
    // registry, which inside a form reads as every field collapsing and then expanding.
    render(
      <Suspense fallback={<span data-testid="ancestor-fallback" />}>
        <Lazy />
      </Suspense>,
    )

    expect(screen.getByTestId('implementation')).toBeInTheDocument()
    expect(screen.queryByTestId('ancestor-fallback')).not.toBeInTheDocument()
  })

  it('surfaces a failed load to the nearest error boundary', async () => {
    // React logs the caught error to the console; it is the assertion below that matters.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const {load, reject} = createDeferredLoad()
    const Lazy = createLazyComponent(load, {fallback: <span data-testid="fallback" />})

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

    const {rerender} = render(
      <Suspense fallback={null}>
        <Lazy />
      </Suspense>,
    )
    rerender(
      <Suspense fallback={null}>
        <Lazy />
      </Suspense>,
    )

    resolve(() => <span data-testid="implementation" />)
    await screen.findByTestId('implementation')

    rerender(
      <Suspense fallback={null}>
        <Lazy />
      </Suspense>,
    )

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
