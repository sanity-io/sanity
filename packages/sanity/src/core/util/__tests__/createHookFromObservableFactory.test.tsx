import React, {Profiler, memo, useDeferredValue} from 'react'
import {render, renderHook, waitFor} from '@testing-library/react'
import * as Rx from 'rxjs'
import {createHookFromObservableFactory} from '../createHookFromObservableFactory'

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('createHookFromObservableFactory', () => {
  it('takes in an observable factory and returns a loading-tuple hook', async () => {
    const observableFactory = (value: string) =>
      Rx.concat(
        Rx.from(tick().then(() => `hello, ${value}`)),
        Rx.from(tick().then(() => `hi, ${value}`))
      )
    const useHook = createHookFromObservableFactory(observableFactory)
    const phasesTimeline: any[] = []
    const renderTimeline: ReturnType<typeof useHook>[] = []
    const TestComponent = ({value}: {value: string}) => {
      renderTimeline.push(useHook(value))
      return null
    }
    render(<TestComponent value="world" />, {
      wrapper: ({children}) => (
        <Profiler id="test" onRender={(id, phase) => phasesTimeline.push(phase)}>
          {children}
        </Profiler>
      ),
    })
    await waitFor(() => expect(renderTimeline.length).toBe(3))

    expect(renderTimeline).toEqual([
      [undefined, true],
      // note: the loading state staying at false is expected here because the
      // next update came from the observable which doesn't tell us when it has
      // an incoming update from it's source (it just pushes and we consume)
      ['hello, world', false],
      ['hi, world', false],
    ])
    expect(phasesTimeline).toEqual(['mount', 'update', 'update'])
  })

  it('flips the loading state if the hook argument changes', async () => {
    const observableFactory = jest.fn((value: string) =>
      Rx.from(tick().then(() => ({value: `hello, ${value}`})))
    )
    const useHook = createHookFromObservableFactory(observableFactory)
    const phasesTimeline: any[] = []
    const renderTimeline: ReturnType<typeof useHook>[] = []

    const TestComponent = ({value}: {value: string}) => {
      const result = useHook(value)
      renderTimeline.push(result)
      return null
    }

    const {rerender} = render(<TestComponent value="world" />, {
      wrapper: ({children}) => (
        <Profiler id="test" onRender={(...args) => phasesTimeline.push(args)}>
          {children}
        </Profiler>
      ),
    })

    await waitFor(() => expect(renderTimeline.length).toBe(2))
    expect(renderTimeline).toEqual([
      [undefined, true],
      [{value: 'hello, world'}, false],
    ])
    expect(observableFactory).toHaveBeenCalledTimes(1)

    rerender(<TestComponent value="hooks" />)
    await waitFor(() => expect(renderTimeline.length).toBe(4))

    expect(renderTimeline).toEqual([
      [undefined, true],
      [{value: 'hello, world'}, false],
      [undefined, true],
      [{value: 'hello, hooks'}, false],
    ])

    expect(observableFactory).toHaveBeenCalledTimes(2)
  })

  // createHookFromObservableFactory uses useSyncExternalStore to trigger re-renders in React if state changes
  // startTransition marks re-renders triggered by new state in one of `useState|useReducer|setState` as low and interruptible priority.
  // But startTransition have no effect on useSyncExternalStore. Which kinda makes sense if you think about it, the hook is named after how it *really wants external stores to be in sync*.
  // This is where the `useDeferredValue` hook comes into play, in fact, pairing up `useDefferedValue` with a child component wrapped in `React.memo` lets you build the same
  // great end-results as pairing `startTransition` + `<Suspense>` boundaries in apps that don't have external state.
  // And this test demonstrates how to do that.
  it('Using React.memo + useDeferrableValue should interrupt and reduce re-renders down the tree similar to startTransition + Suspense', async () => {
    const observableFactory = jest.fn((value: string) =>
      Rx.from(tick().then(() => ({value: `hello, ${value}`})))
    )
    const useHook = createHookFromObservableFactory(observableFactory)
    const phasesTimeline: [id: string, phase: string][] = []
    let syncRenders = 0
    let deferRenders = 0

    const InnerMemoTestComponent = memo(function InnerMemoTestComponent({
      tuple,
    }: {
      tuple: ReturnType<typeof useHook>
    }) {
      deferRenders++
      return <Profiler id="defer" onRender={(id, phase) => phasesTimeline.push([id, phase])} />
    })
    const TestComponent = ({value}: {value: string}) => {
      const result = useHook(value)
      syncRenders++
      const deferredResult = useDeferredValue(result)
      return <InnerMemoTestComponent tuple={deferredResult} />
    }

    const {rerender} = render(<TestComponent value="world" />, {
      wrapper: ({children}) => (
        <Profiler id="sync" onRender={(id, phase) => phasesTimeline.push([id, phase])}>
          {children}
        </Profiler>
      ),
    })

    await waitFor(() => expect(syncRenders).toBe(3))
    await waitFor(() => expect(deferRenders).toBe(2))
    expect(observableFactory).toHaveBeenCalledTimes(1)
    expect(phasesTimeline).toEqual([
      ['defer', 'mount'],
      ['sync', 'mount'],
      ['sync', 'update'],
      ['defer', 'update'],
      ['sync', 'update'],
    ])

    rerender(<TestComponent value="fast" />)
    rerender(<TestComponent value="hooks" />)
    await waitFor(() => expect(syncRenders).toBe(7))
    await waitFor(() => expect(deferRenders).toBe(5))
    expect(observableFactory).toHaveBeenCalledTimes(3)

    expect(observableFactory).toHaveBeenCalledTimes(3)
    expect(phasesTimeline).toEqual([
      ['defer', 'mount'],
      ['sync', 'mount'],
      ['sync', 'update'],
      ['defer', 'update'],
      ['sync', 'update'],
      ['sync', 'update'],
      ['defer', 'update'],
      ['sync', 'update'],
      ['sync', 'update'],
      ['defer', 'update'],
      ['sync', 'update'],
      ['sync', 'update'],
      ['defer', 'update'],
      ['sync', 'update'],
    ])
  })

  it('accepts an initial value and will return that immediately', async () => {
    const observableFactory = jest.fn((value: string) =>
      Rx.from(tick().then(() => `hello, ${value}`))
    )

    const useHook = createHookFromObservableFactory(observableFactory, 'factory initial')
    const renderTimeline: ReturnType<typeof useHook>[] = []
    const TestComponent = ({value}: {value: string}) => {
      const result = useHook(value)
      renderTimeline.push(result)
      return null
    }
    render(<TestComponent value="world" />)

    expect(renderTimeline).toEqual([['factory initial', true]])
    expect(observableFactory).toHaveBeenCalledTimes(1)

    await waitFor(() => expect(renderTimeline.length).toBe(2))

    expect(renderTimeline).toEqual([
      ['factory initial', true],
      ['hello, world', false],
    ])
    expect(observableFactory).toHaveBeenCalledTimes(1)
  })

  it('bubbles errors throws in the observable factory', async () => {
    // Error is hoisted. To prevent it from being printed as uncaught in terminal,
    // we explicitly catch it and suppress it, recording that it has been called.
    const preventer = jest.fn((evt: ErrorEvent) => evt.preventDefault())
    if (typeof window !== 'undefined') {
      window.addEventListener('error', preventer, false)
    }

    const observableFactory = () =>
      Rx.from(
        tick().then(() => {
          throw new Error('test error')
        })
      )

    let error: Error | undefined
    const useHook = createHookFromObservableFactory(observableFactory, 'factory initial')
    renderHook(useHook, {
      wrapper: class Wrapper extends React.Component<React.PropsWithChildren<unknown>> {
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

    if (typeof window !== 'undefined') {
      window.removeEventListener('error', preventer, false)
      expect(preventer).toHaveBeenCalled()
    }
  })
})
