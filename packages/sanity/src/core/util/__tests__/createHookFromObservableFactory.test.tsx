import {act, render, renderHook, waitFor} from '@testing-library/react'
import {Component, memo, type PropsWithChildren, useDeferredValue} from 'react'
import * as Rx from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createHookFromObservableFactory} from '../createHookFromObservableFactory'

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * Renders `null` once a child throws; reports every caught error via
 * `onError`. Reset by remounting (pass a new `key`), which mirrors how
 * boundaries recover in the studio (the pane subtree remounts).
 */
class TestErrorBoundary extends Component<
  PropsWithChildren<{onError: (error: Error) => void}>,
  {hasError: boolean}
> {
  constructor(props: PropsWithChildren<{onError: (error: Error) => void}>) {
    super(props)
    this.state = {hasError: false}
  }
  static getDerivedStateFromError() {
    return {hasError: true}
  }
  override componentDidCatch(error: Error) {
    this.props.onError(error)
  }
  override render() {
    return this.state.hasError ? null : this.props.children
  }
}

describe('createHookFromObservableFactory', () => {
  it('takes in an observable factory and returns a loading-tuple hook', async () => {
    const observableFactory = (value: string) =>
      Rx.concat(
        Rx.from(tick().then(() => `hello, ${value}`)),
        Rx.from(tick().then(() => `hi, ${value}`)),
      )
    const useHook = createHookFromObservableFactory(observableFactory)
    const renderTimeline: ReturnType<typeof useHook>[] = []
    const TestComponent = ({value}: {value: string}) => {
      renderTimeline.push(useHook(value))
      return null
    }
    render(<TestComponent value="world" />)

    // First render is always the loading tuple
    expect(renderTimeline[0]).toEqual([undefined, true])
    // Eventually the final value arrives. Intermediate emissions may be coalesced away,
    // since the hook defers updates.
    // note: the loading state staying at false is expected here because the
    // next update came from the observable which doesn't tell us when it has
    // an incoming update from it's source (it just pushes and we consume)
    await waitFor(() =>
      expect(renderTimeline[renderTimeline.length - 1]).toEqual(['hi, world', false]),
    )
  })

  it('flips the loading state if the hook argument changes', async () => {
    const observableFactory = vi.fn((value: string) =>
      Rx.from(tick().then(() => ({value: `hello, ${value}`}))),
    )
    const useHook = createHookFromObservableFactory(observableFactory)
    const renderTimeline: ReturnType<typeof useHook>[] = []

    const TestComponent = ({value}: {value: string}) => {
      const result = useHook(value)
      renderTimeline.push(result)
      return null
    }

    const {rerender} = render(<TestComponent value="world" />)

    // First render is always the loading tuple
    expect(renderTimeline[0]).toEqual([undefined, true])
    // Eventually the first value arrives
    await waitFor(() =>
      expect(renderTimeline[renderTimeline.length - 1]).toEqual([{value: 'hello, world'}, false]),
    )
    // One factory call per distinct arg — react-rx@4.2.5 fixed a useObservable cache
    // leak that previously caused duplicate subscriptions (and thus double calls).
    expect(observableFactory).toHaveBeenCalledTimes(1)

    const timelineLengthBeforeArgChange = renderTimeline.length
    rerender(<TestComponent value="hooks" />)
    // The first render after the arg change must be the loading tuple: the
    // deferred snapshot belonging to the previous arg must never render as
    // loaded state under the new identity.
    expect(renderTimeline[timelineLengthBeforeArgChange]).toEqual([undefined, true])
    // Eventually the second value arrives
    await waitFor(() =>
      expect(renderTimeline[renderTimeline.length - 1]).toEqual([{value: 'hello, hooks'}, false]),
    )
    // The previous arg's loaded tuple never re-rendered after the arg change.
    expect(renderTimeline.slice(timelineLengthBeforeArgChange)).not.toContainEqual([
      {value: 'hello, world'},
      false,
    ])

    expect(observableFactory).toHaveBeenCalledTimes(2)
  })

  // createHookFromObservableFactory uses useSyncExternalStore to trigger re-renders in React if state changes
  // startTransition marks re-renders triggered by new state in one of `useState|useReducer|setState` as low and interruptible priority.
  // But startTransition have no effect on useSyncExternalStore. Which kinda makes sense if you think about it, the hook is named after how it *really wants external stores to be in sync*.
  // This is where the `useDeferredValue` hook comes into play, in fact, pairing up `useDeferredValue` with a child component wrapped in `React.memo` lets you build the same
  // great end-results as pairing `startTransition` + `<Suspense>` boundaries in apps that don't have external state.
  // And this test demonstrates how to do that.
  it('Using React.memo + useDeferredValue should interrupt and reduce re-renders down the tree similar to startTransition + Suspense', async () => {
    const observableFactory = vi.fn((value: string) =>
      Rx.from(tick().then(() => ({value: `hello, ${value}`}))),
    )
    const useHook = createHookFromObservableFactory(observableFactory)
    let syncRenders = 0
    let deferRenders = 0

    const InnerMemoTestComponent = memo(function InnerMemoTestComponent({
      tuple,
    }: {
      tuple: ReturnType<typeof useHook>
    }) {
      deferRenders++
      return null
    })
    const TestComponent = ({value}: {value: string}) => {
      const result = useHook(value)
      syncRenders++
      const deferredResult = useDeferredValue(result)
      return <InnerMemoTestComponent tuple={deferredResult} />
    }

    const {rerender} = render(<TestComponent value="world" />)

    // Wait for the initial render cycle to settle with the resolved value
    await waitFor(() => expect(syncRenders).toBeGreaterThan(1))
    await waitFor(() => expect(deferRenders).toBeGreaterThan(0))
    // One factory call per distinct arg (see react-rx@4.2.5 cache-leak fix note above).
    expect(observableFactory).toHaveBeenCalledTimes(1)
    // Deferred child should render fewer or equal times than the sync parent
    expect(deferRenders).toBeLessThanOrEqual(syncRenders)

    const syncRendersBeforeRerender = syncRenders
    rerender(<TestComponent value="fast" />)
    rerender(<TestComponent value="hooks" />)
    await waitFor(() => expect(syncRenders).toBeGreaterThan(syncRendersBeforeRerender + 1))

    expect(observableFactory).toHaveBeenCalledTimes(3)
    // Deferred child continues to render fewer or equal times than the sync parent
    expect(deferRenders).toBeLessThanOrEqual(syncRenders)
  })

  it('accepts an initial value and will return that immediately', async () => {
    const observableFactory = vi.fn((value: string) =>
      Rx.from(tick().then(() => `hello, ${value}`)),
    )

    const useHook = createHookFromObservableFactory(observableFactory, 'factory initial')
    const renderTimeline: ReturnType<typeof useHook>[] = []
    const TestComponent = ({value}: {value: string}) => {
      const result = useHook(value)
      renderTimeline.push(result)
      return null
    }
    render(<TestComponent value="world" />)

    // First render returns the initial value in loading state
    expect(renderTimeline[0]).toEqual(['factory initial', true])
    expect(observableFactory).toHaveBeenCalledTimes(1)

    // Eventually the resolved value arrives as the last entry
    await waitFor(() =>
      expect(renderTimeline[renderTimeline.length - 1]).toEqual(['hello, world', false]),
    )
    // Still a single subscription for the same arg after the value arrives.
    expect(observableFactory).toHaveBeenCalledTimes(1)
  })

  it('bubbles errors throws in the observable factory', async () => {
    const observableFactory = () =>
      Rx.from(
        tick().then(() => {
          throw new Error('test error')
        }),
      )

    let error: Error | undefined
    const useHook = createHookFromObservableFactory(observableFactory, 'factory initial')
    renderHook(useHook, {
      // Error is hoisted. To prevent it from being printed as uncaught in terminal,
      // we explicitly catch it and suppress it
      onCaughtError: () => {},
      wrapper: class Wrapper extends Component<PropsWithChildren> {
        static getDerivedStateFromError(err: Error) {
          error = err
          return {hasError: true}
        }
        override render() {
          return this.props.children
        }
      },
    })

    await waitFor(() => expect(error?.message).toBe('test error'))
  })

  it('throws from the live snapshot: no stale frame is committed between the error and the boundary', async () => {
    // Guards the "throw errors from the live snapshot" behavior: the render
    // that observes the error must throw immediately. If the throw were moved
    // to the deferred snapshot instead, the error render would first commit
    // one more frame with the stale (pre-error) tuple — deferred values lag
    // one render behind — and only the deferred catch-up render would throw.
    // The frame count below is the discriminating observation.
    const subject = new Rx.Subject<string>()
    const useHook = createHookFromObservableFactory(() => subject)

    const caughtErrors: Error[] = []
    const renderTimeline: ReturnType<typeof useHook>[] = []
    const TestComponent = () => {
      renderTimeline.push(useHook())
      return null
    }
    render(
      <TestErrorBoundary onError={(error) => caughtErrors.push(error)}>
        <TestComponent />
      </TestErrorBoundary>,
      {onCaughtError: () => {}},
    )

    act(() => subject.next('value before error'))
    await waitFor(() =>
      expect(renderTimeline[renderTimeline.length - 1]).toEqual(['value before error', false]),
    )

    const framesBeforeError = renderTimeline.length
    act(() => subject.error(new Error('live error')))

    await waitFor(() => expect(caughtErrors.map((err) => err.message)).toContain('live error'))
    // The discriminating assertion: the erroring render threw before
    // returning, so it committed no frame. A deferred-side throw would have
    // appended at least one more stale `['value before error', false]` frame.
    expect(renderTimeline.length).toBe(framesBeforeError)
  })

  it('recovers cleanly after an errored arg: the new arg loads without re-throwing or leaking stale state', async () => {
    // Guards the "drops stale errors after recovery" behavior: once an arg's
    // observable has errored (and the boundary caught it), moving on to
    // another arg must render that arg's own loading -> value sequence — the
    // stale error must not be re-thrown and the errored arg's data must not
    // reappear.
    const subjects = new Map<string, Rx.Subject<string>>()
    const observableFactory = vi.fn((arg: string) => {
      if (!subjects.has(arg)) subjects.set(arg, new Rx.Subject<string>())
      return subjects.get(arg)!
    })
    const useHook = createHookFromObservableFactory(observableFactory)

    const caughtErrors: Error[] = []
    const renderTimeline: ReturnType<typeof useHook>[] = []
    const TestComponent = ({value}: {value: string}) => {
      renderTimeline.push(useHook(value))
      return null
    }
    const view = render(
      <TestErrorBoundary key="a" onError={(error) => caughtErrors.push(error)}>
        <TestComponent value="a" />
      </TestErrorBoundary>,
      {onCaughtError: () => {}},
    )

    act(() => subjects.get('a')!.next('value for a'))
    await waitFor(() =>
      expect(renderTimeline[renderTimeline.length - 1]).toEqual(['value for a', false]),
    )

    act(() => subjects.get('a')!.error(new Error('error for a')))
    await waitFor(() => expect(caughtErrors.map((err) => err.message)).toContain('error for a'))

    // Recovery: move on to arg "b". The boundary is keyed, so it remounts —
    // the same way studio boundaries recover when the pane subtree remounts.
    const framesBeforeRecovery = renderTimeline.length
    const catchesBeforeRecovery = caughtErrors.length
    view.rerender(
      <TestErrorBoundary key="b" onError={(error) => caughtErrors.push(error)}>
        <TestComponent value="b" />
      </TestErrorBoundary>,
    )
    act(() => subjects.get('b')!.next('value for b'))

    await waitFor(() =>
      expect(renderTimeline[renderTimeline.length - 1]).toEqual(['value for b', false]),
    )
    const framesAfterRecovery = renderTimeline.slice(framesBeforeRecovery)
    // The recovery starts from b's own loading state and never renders the
    // errored arg's data again.
    expect(framesAfterRecovery[0]).toEqual([undefined, true])
    expect(framesAfterRecovery).not.toContainEqual(['value for a', false])
    // The stale error was not re-thrown into the boundary after recovery.
    expect(caughtErrors.length).toBe(catchesBeforeRecovery)
  })
})
