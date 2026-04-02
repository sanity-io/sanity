import {renderHook} from '@testing-library/react'
import {type RouterContextValue, useRouter} from 'sanity/router'
import {it as baseIt, describe, expect, vi} from 'vitest'

import {selectActiveTransition, useDiffViewState} from './useDiffViewState'

vi.mock('sanity/router', () => ({
  useRouter: vi.fn(),
}))

function makeRouterState(searchParams: Record<string, string>): RouterContextValue {
  return {
    state: {
      _searchParams: Object.entries(searchParams).map(([key, value]): [string, string] => [
        key,
        value,
      ]),
    },
    stickyParams: {},
    resolvePathFromState: vi.fn(),
    resolveIntentLink: vi.fn(),
    navigateUrl: vi.fn(),
    navigateStickyParams: vi.fn(),
    navigate: vi.fn(),
    navigateIntent: vi.fn(),
  }
}

const ACTIVE_SEARCH_PARAMS = {
  diffView: 'version',
  previousDocument: 'article,doc-1',
  nextDocument: 'article,doc-2',
}

type SetRouterState = (searchParams: Record<string, string>) => void

interface Fixtures {
  setRouterState: SetRouterState
}

const it = baseIt.extend<Fixtures>({
  // oxlint-disable-next-line no-empty-pattern
  setRouterState: async ({}, consume) => {
    const mock = vi.mocked(useRouter)

    const setter: SetRouterState = (searchParams) => {
      mock.mockReturnValue(makeRouterState(searchParams))
    }

    await consume(setter)
    mock.mockReset()
  },
})

describe('useDiffViewState', () => {
  describe('onActiveChanged', () => {
    it('is called with undefined previous state and the inactive next state on initial render when diff view is inactive', ({
      setRouterState,
    }) => {
      setRouterState({})
      const onActiveChanged = vi.fn()

      renderHook(() => useDiffViewState({onActiveChanged}))

      expect(onActiveChanged).toHaveBeenCalledTimes(1)

      expect(onActiveChanged).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({isActive: false}),
      )
    })

    it('is called with undefined previous state and the active next state on initial render when diff view is active', ({
      setRouterState,
    }) => {
      setRouterState(ACTIVE_SEARCH_PARAMS)
      const onActiveChanged = vi.fn()

      renderHook(() => useDiffViewState({onActiveChanged}))

      expect(onActiveChanged).toHaveBeenCalledTimes(1)
      expect(onActiveChanged).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({isActive: true}),
      )
    })

    it('is called when transitioning from inactive to active', ({setRouterState}) => {
      setRouterState({})
      const onActiveChanged = vi.fn()

      const {rerender} = renderHook(() => useDiffViewState({onActiveChanged}))
      onActiveChanged.mockClear()

      setRouterState(ACTIVE_SEARCH_PARAMS)
      rerender()

      expect(onActiveChanged).toHaveBeenCalledTimes(1)
      expect(onActiveChanged).toHaveBeenCalledWith(
        expect.objectContaining({isActive: false}),
        expect.objectContaining({isActive: true}),
      )
    })

    it('is called when transitioning from active to inactive', ({setRouterState}) => {
      setRouterState(ACTIVE_SEARCH_PARAMS)
      const onActiveChanged = vi.fn()

      const {rerender} = renderHook(() => useDiffViewState({onActiveChanged}))
      onActiveChanged.mockClear()

      setRouterState({})
      rerender()

      expect(onActiveChanged).toHaveBeenCalledTimes(1)
      expect(onActiveChanged).toHaveBeenCalledWith(
        expect.objectContaining({isActive: true}),
        expect.objectContaining({isActive: false}),
      )
    })

    it('is not called when isActive remains true and only target documents change', ({
      setRouterState,
    }) => {
      setRouterState(ACTIVE_SEARCH_PARAMS)
      const onActiveChanged = vi.fn()

      const {rerender} = renderHook(() => useDiffViewState({onActiveChanged}))
      onActiveChanged.mockClear()

      setRouterState({...ACTIVE_SEARCH_PARAMS, nextDocument: 'article,doc-99'})
      rerender()

      expect(onActiveChanged).not.toHaveBeenCalled()
    })

    it('is not called when isActive remains false across re-renders', ({setRouterState}) => {
      setRouterState({})
      const onActiveChanged = vi.fn()

      const {rerender} = renderHook(() => useDiffViewState({onActiveChanged}))
      onActiveChanged.mockClear()

      rerender()

      expect(onActiveChanged).not.toHaveBeenCalled()
    })

    it('is not called when onActiveChanged is not provided', ({setRouterState}) => {
      setRouterState({})
      const {rerender} = renderHook(() => useDiffViewState())

      setRouterState(ACTIVE_SEARCH_PARAMS)
      expect(() => rerender()).not.toThrow()
    })

    it('passes the correct previous and next state shapes when becoming active', ({
      setRouterState,
    }) => {
      setRouterState({})
      const onActiveChanged = vi.fn()

      const {rerender} = renderHook(() => useDiffViewState({onActiveChanged}))
      onActiveChanged.mockClear()

      setRouterState(ACTIVE_SEARCH_PARAMS)
      rerender()

      const [previousState, nextState] = onActiveChanged.mock.calls[0]

      expect(previousState).toEqual({isActive: false})
      expect(nextState).toEqual({
        isActive: true,
        state: 'ready',
        mode: 'version',
        documents: {
          previous: {type: 'article', id: 'doc-1'},
          next: {type: 'article', id: 'doc-2'},
        },
      })
    })

    it('passes the correct previous and next state shapes when becoming inactive', ({
      setRouterState,
    }) => {
      setRouterState(ACTIVE_SEARCH_PARAMS)
      const onActiveChanged = vi.fn()

      const {rerender} = renderHook(() => useDiffViewState({onActiveChanged}))
      onActiveChanged.mockClear()

      setRouterState({})
      rerender()

      const [previousState, nextState] = onActiveChanged.mock.calls[0]

      expect(previousState).toEqual({
        isActive: true,
        state: 'ready',
        mode: 'version',
        documents: {
          previous: {type: 'article', id: 'doc-1'},
          next: {type: 'article', id: 'doc-2'},
        },
      })
      expect(nextState).toEqual({isActive: false})
    })
  })

  describe('onTargetDocumentsChanged', () => {
    it('is not called on initial render', ({setRouterState}) => {
      setRouterState(ACTIVE_SEARCH_PARAMS)
      const onTargetDocumentsChanged = vi.fn()

      renderHook(() => useDiffViewState({onTargetDocumentsChanged}))

      expect(onTargetDocumentsChanged).not.toHaveBeenCalled()
    })

    it('is called when the previous document id changes', ({setRouterState}) => {
      setRouterState(ACTIVE_SEARCH_PARAMS)
      const onTargetDocumentsChanged = vi.fn()

      const {rerender} = renderHook(() => useDiffViewState({onTargetDocumentsChanged}))

      setRouterState({...ACTIVE_SEARCH_PARAMS, previousDocument: 'article,doc-99'})
      rerender()

      expect(onTargetDocumentsChanged).toHaveBeenCalledTimes(1)
      expect(onTargetDocumentsChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: expect.objectContaining({previous: {type: 'article', id: 'doc-1'}}),
        }),
        expect.objectContaining({
          documents: expect.objectContaining({previous: {type: 'article', id: 'doc-99'}}),
        }),
      )
    })

    it('is called when the next document id changes', ({setRouterState}) => {
      setRouterState(ACTIVE_SEARCH_PARAMS)
      const onTargetDocumentsChanged = vi.fn()

      const {rerender} = renderHook(() => useDiffViewState({onTargetDocumentsChanged}))

      setRouterState({...ACTIVE_SEARCH_PARAMS, nextDocument: 'article,doc-99'})
      rerender()

      expect(onTargetDocumentsChanged).toHaveBeenCalledTimes(1)
      expect(onTargetDocumentsChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: expect.objectContaining({next: {type: 'article', id: 'doc-2'}}),
        }),
        expect.objectContaining({
          documents: expect.objectContaining({next: {type: 'article', id: 'doc-99'}}),
        }),
      )
    })

    it('is called when both document ids change', ({setRouterState}) => {
      setRouterState(ACTIVE_SEARCH_PARAMS)
      const onTargetDocumentsChanged = vi.fn()

      const {rerender} = renderHook(() => useDiffViewState({onTargetDocumentsChanged}))

      setRouterState({
        diffView: 'version',
        previousDocument: 'article,doc-10',
        nextDocument: 'article,doc-20',
      })
      rerender()

      expect(onTargetDocumentsChanged).toHaveBeenCalledTimes(1)
      expect(onTargetDocumentsChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: {
            previous: {type: 'article', id: 'doc-1'},
            next: {type: 'article', id: 'doc-2'},
          },
        }),
        expect.objectContaining({
          documents: {
            previous: {type: 'article', id: 'doc-10'},
            next: {type: 'article', id: 'doc-20'},
          },
        }),
      )
    })

    it('is not called when document ids remain the same across re-renders', ({setRouterState}) => {
      setRouterState(ACTIVE_SEARCH_PARAMS)
      const onTargetDocumentsChanged = vi.fn()

      const {rerender} = renderHook(() => useDiffViewState({onTargetDocumentsChanged}))

      rerender()

      expect(onTargetDocumentsChanged).not.toHaveBeenCalled()
    })

    it('is not called when transitioning from active to inactive', ({setRouterState}) => {
      setRouterState(ACTIVE_SEARCH_PARAMS)
      const onTargetDocumentsChanged = vi.fn()

      const {rerender} = renderHook(() => useDiffViewState({onTargetDocumentsChanged}))

      setRouterState({})
      rerender()

      expect(onTargetDocumentsChanged).not.toHaveBeenCalled()
    })

    it('is not called when transitioning from inactive to active', ({setRouterState}) => {
      setRouterState({})
      const onTargetDocumentsChanged = vi.fn()

      const {rerender} = renderHook(() => useDiffViewState({onTargetDocumentsChanged}))

      setRouterState(ACTIVE_SEARCH_PARAMS)
      rerender()

      expect(onTargetDocumentsChanged).not.toHaveBeenCalled()
    })

    it('is not called when onTargetDocumentsChanged is not provided', ({setRouterState}) => {
      setRouterState(ACTIVE_SEARCH_PARAMS)
      const {rerender} = renderHook(() => useDiffViewState())

      setRouterState({...ACTIVE_SEARCH_PARAMS, nextDocument: 'article,doc-99'})
      expect(() => rerender()).not.toThrow()
    })

    it('passes the correct full previous and next state shapes', ({setRouterState}) => {
      setRouterState(ACTIVE_SEARCH_PARAMS)
      const onTargetDocumentsChanged = vi.fn()

      const {rerender} = renderHook(() => useDiffViewState({onTargetDocumentsChanged}))

      setRouterState({...ACTIVE_SEARCH_PARAMS, nextDocument: 'article,doc-99'})
      rerender()

      const [previousState, nextState] = onTargetDocumentsChanged.mock.calls[0]

      expect(previousState).toEqual({
        isActive: true,
        state: 'ready',
        mode: 'version',
        documents: {
          previous: {type: 'article', id: 'doc-1'},
          next: {type: 'article', id: 'doc-2'},
        },
      })
      expect(nextState).toEqual({
        isActive: true,
        state: 'ready',
        mode: 'version',
        documents: {
          previous: {type: 'article', id: 'doc-1'},
          next: {type: 'article', id: 'doc-99'},
        },
      })
    })
  })
})

describe('selectActiveTransition', () => {
  it('returns "entered" when transitioning from inactive to active', () => {
    expect(selectActiveTransition({isActive: false}, {isActive: true})).toBe('entered')
  })

  it('returns "entered" when transitioning from undefined to active', () => {
    expect(selectActiveTransition(undefined, {isActive: true})).toBe('entered')
  })

  it('returns "exited" when transitioning from active to inactive', () => {
    expect(selectActiveTransition({isActive: true}, {isActive: false})).toBe('exited')
  })

  it('returns undefined when isActive remains false', () => {
    expect(selectActiveTransition({isActive: false}, {isActive: false})).toBeUndefined()
  })

  it('returns undefined when isActive remains true', () => {
    expect(selectActiveTransition({isActive: true}, {isActive: true})).toBeUndefined()
  })

  it('returns undefined when previous state is undefined and state is inactive', () => {
    expect(selectActiveTransition(undefined, {isActive: false})).toBeUndefined()
  })
})
