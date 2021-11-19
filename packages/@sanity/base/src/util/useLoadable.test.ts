import * as Rx from 'rxjs'
import {act, renderHook} from '@testing-library/react-hooks'
import {useLoadable, createLoadableHook} from './useLoadable'

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('useLoadable', () => {
  it('is a hook that takes in an observable and returns re-rendering LoadableState', async () => {
    const observable = new Rx.Subject<number>()
    const {result} = renderHook(() => useLoadable(observable))

    await act(async () => {
      observable.next(1)
      await tick()
      observable.next(2)
      await tick()
      observable.next(3)
    })

    expect(result.all).toEqual([
      {error: undefined, isLoading: true, value: undefined},
      {error: undefined, isLoading: false, value: 1},
      {error: undefined, isLoading: false, value: 2},
      {error: undefined, isLoading: false, value: 3},
    ])
  })

  it('catches errors in the given stream and returns an ErrorState', () => {
    const observable = new Rx.Subject<number>()
    const {result} = renderHook(() => useLoadable(observable))

    act(() => {
      observable.error(new Error('example error'))
    })

    expect(result.all).toHaveLength(2)
    expect(result.all).toMatchObject([
      {error: undefined, isLoading: true, value: undefined},
      {error: {message: 'example error'}, isLoading: false, value: undefined},
    ])
  })

  it('skips the loading state if there is an initial value', async () => {
    const observable = new Rx.Subject<number>()
    const {result} = renderHook(() => useLoadable(observable, 0))

    await act(async () => {
      observable.next(1)
      await tick()
      observable.next(2)
      await tick()
      observable.next(3)
    })

    expect(result.all).toEqual([
      {error: undefined, isLoading: false, value: 0},
      {error: undefined, isLoading: false, value: 1},
      {error: undefined, isLoading: false, value: 2},
      {error: undefined, isLoading: false, value: 3},
    ])
  })
})

describe('createLoadableHook', () => {
  it('takes in an observable and returns a useLoadable hook', () => {
    const useNumbers = createLoadableHook(Rx.of(1, 2, 3))
    const {result} = renderHook(() => useNumbers())

    expect(result.current).toEqual({error: undefined, isLoading: false, value: 3})
  })

  it('takes in a function returns an observable and returns a useLoadable hook', async () => {
    const numbers$ = new Rx.Subject<number>()
    const observableFactory = jest.fn((n: number) => Rx.of(n + 1))
    const useNumbersPlusOne = createLoadableHook(observableFactory)

    function useTest() {
      const number = useLoadable(numbers$)
      const numberPlusOne = useNumbersPlusOne(number.value || 0)

      return numberPlusOne
    }

    const {result} = renderHook(() => useTest())

    await act(async () => {
      numbers$.next(1)
      await tick()
      numbers$.next(2)
      await tick()
      numbers$.next(3)
    })

    expect(result.current).toEqual({error: undefined, isLoading: false, value: 4})
    expect(observableFactory.mock.calls).toEqual([[0], [1], [2], [3]])
  })
})
