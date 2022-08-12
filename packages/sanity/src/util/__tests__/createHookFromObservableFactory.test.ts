import {renderHook} from '@testing-library/react-hooks'
import {uniq} from 'lodash'
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
    const {result, waitForNextUpdate} = renderHook(() => useHook('world'))

    await waitForNextUpdate()

    expect(result.all).toEqual([
      [undefined, true],
      // note: the loading state staying at false is expected here because the
      // next update came from the observable which doesn't tell us when it has
      // an incoming update from it's source (it just pushes and we consume)
      ['hello, world', false],
      ['hi, world', false],
    ])
  })

  it('flips the loading state if the hook argument changes', async () => {
    const observableFactory = jest.fn((value: string) =>
      Rx.from(tick().then(() => ({value: `hello, ${value}`})))
    )
    const useHook = createHookFromObservableFactory(observableFactory)
    const {result, rerender, waitForNextUpdate} = renderHook(useHook, {initialProps: 'world'})
    await waitForNextUpdate()

    rerender('hooks')
    await waitForNextUpdate()

    // using `uniq` because the hooks testing library will
    // log it twice but it is the same instance
    expect(uniq(result.all)).toEqual([
      [undefined, true],
      [{value: 'hello, world'}, false],
      [{value: 'hello, world'}, true],
      [{value: 'hello, hooks'}, false],
    ])

    expect(observableFactory).toHaveBeenCalledTimes(2)
  })

  it('accepts an initial value and will return that immediately', async () => {
    const observableFactory = jest.fn((value: string) =>
      Rx.from(tick().then(() => `hello, ${value}`))
    )

    const useHook = createHookFromObservableFactory(observableFactory, {
      initialValue: 'factory initial',
    })
    const {result, waitForNextUpdate} = renderHook(useHook, {initialProps: 'world'})

    await waitForNextUpdate()

    expect(result.all).toEqual([
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

    const useHook = createHookFromObservableFactory(observableFactory, {
      initialValue: 'factory initial',
    })
    const {result, waitForNextUpdate} = renderHook(useHook, {initialProps: 'world'})
    await waitForNextUpdate()

    expect(result.error?.message).toBe('test error')

    if (typeof window !== 'undefined') {
      window.removeEventListener('error', preventer, false)
      expect(preventer).toHaveBeenCalled()
    }
  })
})
