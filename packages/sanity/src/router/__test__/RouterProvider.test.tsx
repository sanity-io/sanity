import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {RouterProvider} from '../RouterProvider'
import {type Router, type RouterState} from '../types'
import {useRouter} from '../useRouter'

vi.mock('../stickyParams', () => ({
  STICKY_PARAMS: ['stickyFirstParam', 'anotherStickyParam'],
}))

const mockOnNavigate = vi.fn()

const mockRouter: Router = {
  encode: vi.fn((state) => state),
  decode: vi.fn((path) => path),
  _isRoute: false,
  isNotFound: vi.fn(() => false),
  getBasePath: vi.fn(() => '/'),
  getRedirectBase: vi.fn(() => null),
  isRoot: vi.fn(() => false),
  route: {
    raw: '/',
    segments: [],
  },
  children: [],
}

const initialState: RouterState = {
  _searchParams: [['stickyFirstParam', 'stickyFirstParamValue']],
}

const wrapper = ({children}: {children: React.ReactNode}) => (
  <RouterProvider onNavigate={mockOnNavigate} router={mockRouter} state={initialState}>
    {children}
  </RouterProvider>
)

describe('RouterProvider', () => {
  beforeEach(() => {
    mockOnNavigate.mockClear()
  })

  describe('navigate', () => {
    it('should update only the route state when navigating without stickyParams', () => {
      const {result} = renderHook(() => useRouter(), {wrapper})

      act(() => {
        result.current.navigate({routeStateKey: 'newRouteStateValue'})
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [['stickyFirstParam', 'stickyFirstParamValue']],
          routeStateKey: 'newRouteStateValue',
        },
      })
    })

    it('should navigate with allowed sticky params', () => {
      const {result} = renderHook(() => useRouter(), {wrapper})

      act(() => {
        result.current.navigate({
          stickyParams: {
            anotherStickyParam: 'anotherStickyParamValue',
          },
        })
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [
            ['stickyFirstParam', 'stickyFirstParamValue'],
            ['anotherStickyParam', 'anotherStickyParamValue'],
          ],
        },
      })
    })

    it('should update both the route state and stickyParams when navigating', () => {
      const {result} = renderHook(() => useRouter(), {wrapper})

      act(() => {
        result.current.navigate(
          {routeStateKey: 'newRouteStateValue'},
          {
            stickyParams: {
              stickyFirstParam: 'updatedStickyFirstParamValue',
              anotherStickyParam: 'anotherStickyParamValue',
            },
          },
        )
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [
            ['stickyFirstParam', 'updatedStickyFirstParamValue'],
            ['anotherStickyParam', 'anotherStickyParamValue'],
          ],
          routeStateKey: 'newRouteStateValue',
        },
      })
    })

    it('should apply only stickyParams when navigating with null state', () => {
      const {result} = renderHook(() => useRouter(), {wrapper})

      act(() => {
        result.current.navigate({
          stickyParams: {
            stickyFirstParam: 'newStickyFirstParamValue',
            anotherStickyParam: 'anotherStickyParamValue',
          },
        })
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [
            ['stickyFirstParam', 'newStickyFirstParamValue'],
            ['anotherStickyParam', 'anotherStickyParamValue'],
          ],
        },
      })
    })

    it('should throw an error if stickyParams contains invalid keys', () => {
      const {result} = renderHook(() => useRouter(), {wrapper})

      expect(() => {
        act(() => {
          result.current.navigate({stickyParams: {invalidStickyParam: 'invalidValue'}})
        })
      }).toThrowError('One or more parameters are not sticky')
    })

    it('should throw an error if stickyParams contains disallowed keys', () => {
      const {result} = renderHook(() => useRouter(), {wrapper})

      expect(() => {
        act(() => {
          result.current.navigate({stickyParams: {disallowedParam: 'disallowedValue'}})
        })
      }).toThrowError('One or more parameters are not sticky')
    })
  })

  describe('navigateStickyParams', () => {
    it('should navigate using handleNavigateStickyParams with valid sticky params', () => {
      const {result} = renderHook(() => useRouter(), {wrapper})

      act(() => {
        result.current.navigateStickyParams({stickyFirstParam: 'updatedStickyFirstParamValue'})
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [['stickyFirstParam', 'updatedStickyFirstParamValue']],
        },
      })
    })

    it('should merge new stickyParams with existing stickyParams when navigatingStickyParams', () => {
      const {result} = renderHook(() => useRouter(), {wrapper})

      act(() => {
        result.current.navigateStickyParams({
          stickyFirstParam: 'updatedStickyFirstParamValue',
          anotherStickyParam: 'anotherStickyParamValue',
        })
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [
            ['stickyFirstParam', 'updatedStickyFirstParamValue'],
            ['anotherStickyParam', 'anotherStickyParamValue'],
          ],
        },
      })
    })

    it('should throw an error when navigateStickyParams is called with disallowed sticky params', () => {
      const {result} = renderHook(() => useRouter(), {wrapper})

      expect(() => {
        act(() => {
          result.current.navigateStickyParams({disallowedParam: 'disallowedValue'})
        })
      }).toThrowError('One or more parameters are not sticky')
    })
  })

  describe('resolvePathFromState', () => {
    it('should handle null state gracefully', () => {
      const {result} = renderHook(() => useRouter(), {wrapper})

      vi.mocked(mockRouter.encode).mockClear()

      result.current.resolvePathFromState(null)

      expect(mockRouter.encode).toHaveBeenCalledWith({
        _searchParams: [['stickyFirstParam', 'stickyFirstParamValue']],
      })
    })

    it('should properly merge search params when resolving path', () => {
      const {result} = renderHook(() => useRouter(), {wrapper})

      vi.mocked(mockRouter.encode).mockClear()

      result.current.resolvePathFromState({
        testKey: 'testValue',
        _searchParams: [['nonStickyParam', 'nonStickyValue']],
      })

      expect(mockRouter.encode).toHaveBeenCalledWith({
        testKey: 'testValue',
        _searchParams: [
          ['nonStickyParam', 'nonStickyValue'],
          ['stickyFirstParam', 'stickyFirstParamValue'],
        ],
      })
    })
  })

  describe('new navigate API', () => {
    it('should keep current state when navigating with options object only', () => {
      const {result} = renderHook(() => useRouter(), {
        wrapper: ({children}) => (
          <RouterProvider
            onNavigate={mockOnNavigate}
            router={mockRouter}
            state={{
              existingKey: 'existingValue',
              _searchParams: [['stickyFirstParam', 'stickyFirstParamValue']],
            }}
          >
            {children}
          </RouterProvider>
        ),
      })

      act(() => {
        result.current.navigate({
          stickyParams: {
            stickyFirstParam: 'newStickyValue',
          },
          replace: true,
        })
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          existingKey: 'existingValue',
          _searchParams: [['stickyFirstParam', 'newStickyValue']],
        },
        replace: true,
      })
    })

    it('should go to root route when navigating with null state in options', () => {
      const {result} = renderHook(() => useRouter(), {
        wrapper: ({children}) => (
          <RouterProvider
            onNavigate={mockOnNavigate}
            router={mockRouter}
            state={{
              existingKey: 'existingValue',
              _searchParams: [['stickyFirstParam', 'stickyFirstParamValue']],
            }}
          >
            {children}
          </RouterProvider>
        ),
      })

      act(() => {
        result.current.navigate({
          state: null,
          stickyParams: {
            stickyFirstParam: 'newStickyValue',
          },
        })
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [['stickyFirstParam', 'newStickyValue']],
        },
      })
    })

    it('should create new state when navigating with specific state in options', () => {
      const {result} = renderHook(() => useRouter(), {
        wrapper: ({children}) => (
          <RouterProvider
            onNavigate={mockOnNavigate}
            router={mockRouter}
            state={{
              existingKey: 'existingValue',
              _searchParams: [['stickyFirstParam', 'stickyFirstParamValue']],
            }}
          >
            {children}
          </RouterProvider>
        ),
      })

      act(() => {
        result.current.navigate({
          state: {
            newKey: 'newValue',
          },
          stickyParams: {
            stickyFirstParam: 'newStickyValue',
          },
        })
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          newKey: 'newValue',
          _searchParams: [['stickyFirstParam', 'newStickyValue']],
        },
      })
    })

    it('should create new state when navigating with state change and no sticky params', () => {
      const {result} = renderHook(() => useRouter(), {
        wrapper: ({children}) => (
          <RouterProvider
            onNavigate={mockOnNavigate}
            router={mockRouter}
            state={{
              existingKey: 'existingValue',
              _searchParams: [['stickyFirstParam', 'stickyFirstParamValue']],
            }}
          >
            {children}
          </RouterProvider>
        ),
      })

      act(() => {
        result.current.navigate({
          state: {
            newKey: 'newValue',
          },
        })
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          newKey: 'newValue',
          _searchParams: [['stickyFirstParam', 'stickyFirstParamValue']],
        },
      })
    })

    it('should keep the current state when navigating with undefined state', () => {
      const {result} = renderHook(() => useRouter(), {
        wrapper: ({children}) => (
          <RouterProvider
            onNavigate={mockOnNavigate}
            router={mockRouter}
            state={{
              existingKey: 'existingValue',
              _searchParams: [['stickyFirstParam', 'stickyFirstParamValue']],
            }}
          >
            {children}
          </RouterProvider>
        ),
      })

      act(() => {
        result.current.navigate({
          state: undefined,
          replace: true,
        })
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          existingKey: 'existingValue',
          _searchParams: [['stickyFirstParam', 'stickyFirstParamValue']],
        },
        replace: true,
      })
    })

    it('should not preserve non-sticky params when navigating to a new state', () => {
      const {result} = renderHook(() => useRouter(), {
        wrapper: ({children}) => (
          <RouterProvider
            onNavigate={mockOnNavigate}
            router={mockRouter}
            state={{
              existingKey: 'existingValue',
              _searchParams: [
                ['stickyFirstParam', 'stickyFirstParamValue'],
                ['nonStickyParam', 'nonStickyValue'],
              ],
            }}
          >
            {children}
          </RouterProvider>
        ),
      })

      act(() => {
        result.current.navigate({
          state: {
            newKey: 'newValue',
            _searchParams: [['anotherNonSticky', 'anotherValue']],
          },
        })
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          newKey: 'newValue',
          _searchParams: [
            ['anotherNonSticky', 'anotherValue'],
            ['stickyFirstParam', 'stickyFirstParamValue'],
          ],
        },
      })
    })
  })
})
