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
    it('should navigate with new state', () => {
      const {result} = renderHook(() => useRouter(), {wrapper})

      act(() => {
        result.current.navigate({routeStateKey: 'routeStateValue'})
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [['stickyFirstParam', 'stickyFirstParamValue']],
          routeStateKey: 'routeStateValue',
        },
      })
    })

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
        result.current.navigate(null, {
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
        result.current.navigate(null, {
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
          result.current.navigate(null, {stickyParams: {invalidStickyParam: 'invalidValue'}})
        })
      }).toThrowError('One or more parameters are not sticky')
    })

    it('should throw an error if stickyParams contains disallowed keys', () => {
      const {result} = renderHook(() => useRouter(), {wrapper})

      expect(() => {
        act(() => {
          result.current.navigate(null, {stickyParams: {disallowedParam: 'disallowedValue'}})
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
})
