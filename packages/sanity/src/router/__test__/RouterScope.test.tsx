import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {RouterProvider} from '../RouterProvider'
import {RouteScope} from '../RouteScope'
import {type Router, type RouterState} from '../types'
import {useRouter} from '../useRouter'

vi.mock('../stickyParams', () => ({
  STICKY_PARAMS: ['stickyParam'],
}))

const mockOnNavigate = vi.fn()

const mockRouter: Router = {
  encode: vi.fn((state) => state) as unknown as Router['encode'] & {mockClear: () => void},
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
  _searchParams: [['stickyParam', 'stickyValue']],
  tool: 'desk',
}

interface WrapperProps {
  children: React.ReactNode
}

const createWrapper = (disableScopedSearchParams = false) => {
  const Wrapper = ({children}: WrapperProps) => (
    <RouterProvider onNavigate={mockOnNavigate} router={mockRouter} state={initialState}>
      <RouteScope scope="testScope" __unsafe_disableScopedSearchParams={disableScopedSearchParams}>
        {children}
      </RouteScope>
    </RouterProvider>
  )
  Wrapper.displayName = 'TestWrapper'
  return Wrapper
}

describe('RouteScope', () => {
  beforeEach(() => {
    mockOnNavigate.mockClear()
  })

  describe('state scoping', () => {
    it('should scope router state to the provided scope', () => {
      const wrapper = createWrapper()
      const {result} = renderHook(() => useRouter(), {wrapper})

      expect(result.current.state).toEqual({
        _searchParams: undefined,
      })

      expect(result.current.stickyParams).toEqual({
        stickyParam: 'stickyValue',
      })
    })

    it('should maintain parent state when navigating within scope', () => {
      const wrapper = createWrapper()
      const {result} = renderHook(() => useRouter(), {wrapper})

      act(() => {
        result.current.navigate({scopedKey: 'scopedValue'})
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [['stickyParam', 'stickyValue']],
          tool: 'desk',
          testScope: {
            scopedKey: 'scopedValue',
          },
        },
      })
    })
  })

  describe('search params scoping', () => {
    it('should scope search params when scoping is enabled', () => {
      const wrapper = createWrapper(false)
      const {result} = renderHook(() => useRouter(), {wrapper})

      act(() => {
        result.current.navigate({
          _searchParams: [['testParam', 'testValue']],
        })
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [['stickyParam', 'stickyValue']],
          tool: 'desk',
          testScope: {
            _searchParams: [['testParam', 'testValue']],
          },
        },
      })
    })

    it('should not scope search params when scoping is disabled', () => {
      const wrapper = createWrapper(true)
      const {result} = renderHook(() => useRouter(), {wrapper})

      act(() => {
        result.current.navigate({
          _searchParams: [['testParam', 'testValue']],
        })
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [
            ['testParam', 'testValue'],
            ['stickyParam', 'stickyValue'],
          ],
          tool: 'desk',
          testScope: {},
        },
      })
    })
  })

  describe('sticky params', () => {
    it('should handle sticky params navigation within scope', () => {
      const wrapper = createWrapper()
      const {result} = renderHook(() => useRouter(), {wrapper})

      act(() => {
        result.current.navigate({
          stickyParams: {
            stickyParam: 'newStickyValue',
          },
        })
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [['stickyParam', 'newStickyValue']],
          tool: 'desk',
        },
      })
    })

    it('should throw an error when navigating with invalid sticky params', () => {
      const wrapper = createWrapper()
      const {result} = renderHook(() => useRouter(), {wrapper})

      expect(() => {
        act(() => {
          result.current.navigate({
            stickyParams: {invalidParam: 'invalidValue'},
          })
        })
      }).toThrowError('One or more parameters are not sticky')
    })

    it('should merge new sticky params with existing ones', () => {
      const wrapper = createWrapper()
      const {result} = renderHook(() => useRouter(), {wrapper})

      act(() => {
        result.current.navigate(
          {scopedValue: 'test'},
          {
            stickyParams: {
              stickyParam: 'newStickyValue',
            },
          },
        )
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [['stickyParam', 'newStickyValue']],
          tool: 'desk',
          testScope: {
            scopedValue: 'test',
          },
        },
      })
    })
  })

  describe('nested scopes', () => {
    it('should handle nested route scopes correctly', () => {
      const NestedWrapper = ({children}: WrapperProps) => (
        <RouterProvider onNavigate={mockOnNavigate} router={mockRouter} state={initialState}>
          <RouteScope scope="parentScope">
            <RouteScope scope="childScope">{children}</RouteScope>
          </RouteScope>
        </RouterProvider>
      )
      NestedWrapper.displayName = 'NestedWrapper'

      const {result} = renderHook(() => useRouter(), {wrapper: NestedWrapper})

      act(() => {
        result.current.navigate({nestedValue: 'test'})
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [['stickyParam', 'stickyValue']],
          tool: 'desk',
          parentScope: {
            childScope: {
              nestedValue: 'test',
            },
          },
        },
      })
    })
  })

  describe('intent handling', () => {
    it('should preserve scope when navigating with intent', () => {
      const wrapper = createWrapper()
      const {result} = renderHook(() => useRouter(), {wrapper})

      act(() => {
        result.current.navigateIntent('test', {id: 'test-id'})
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          intent: 'test',
          params: {id: 'test-id'},
          _searchParams: [['stickyParam', 'stickyValue']],
        },
      })
    })
  })

  describe('resolvePathFromState', () => {
    it('should correctly resolve path from scoped state', () => {
      const wrapper = createWrapper()
      const {result} = renderHook(() => useRouter(), {wrapper})

      vi.mocked(mockRouter.encode).mockClear()

      result.current.resolvePathFromState({
        scopedValue: 'test',
        _searchParams: [['testParam', 'testValue']],
      })

      expect(mockRouter.encode).toHaveBeenCalledWith({
        _searchParams: [['stickyParam', 'stickyValue']],
        tool: 'desk',
        testScope: {
          scopedValue: 'test',
          _searchParams: [['testParam', 'testValue']],
        },
      })
    })
  })

  describe('search params inheritance', () => {
    it('should inherit parent search params when enabled', () => {
      const wrapper = createWrapper(false)
      const {result} = renderHook(() => useRouter(), {wrapper})

      act(() => {
        result.current.navigate({
          _searchParams: [['scopedParam', 'scopedValue']],
        })
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [['stickyParam', 'stickyValue']],
          tool: 'desk',
          testScope: {
            _searchParams: [['scopedParam', 'scopedValue']],
          },
        },
      })
    })
  })

  describe('error handling', () => {
    it('should handle null state gracefully', () => {
      const wrapper = createWrapper()
      const {result} = renderHook(() => useRouter(), {wrapper})

      act(() => {
        result.current.navigate({})
      })

      expect(mockOnNavigate).toHaveBeenCalledWith({
        path: {
          _searchParams: [['stickyParam', 'stickyValue']],
          testScope: {
            _searchParams: undefined,
          },
          tool: 'desk',
        },
        replace: undefined,
      })
    })
  })

  it('should keep current state when navigating with options object only', () => {
    const wrapper = createWrapper()
    const {result} = renderHook(() => useRouter(), {wrapper})

    act(() => {
      result.current.navigate({
        stickyParams: {
          stickyParam: 'newStickyValue',
        },
        replace: true,
      })
    })

    expect(mockOnNavigate).toHaveBeenCalledWith({
      path: {
        _searchParams: [['stickyParam', 'newStickyValue']],
        tool: 'desk',
      },
      replace: true,
    })
  })

  it('should go to root route when navigating with null state in options', () => {
    const wrapper = createWrapper()
    const {result} = renderHook(() => useRouter(), {wrapper})

    act(() => {
      result.current.navigate({
        state: null,
        stickyParams: {
          stickyParam: 'newStickyValue',
        },
      })
    })

    expect(mockOnNavigate).toHaveBeenCalledWith({
      path: {
        _searchParams: [['stickyParam', 'newStickyValue']],
      },
    })
  })

  it('should handle navigate with specific state in options', () => {
    const wrapper = createWrapper()
    const {result} = renderHook(() => useRouter(), {wrapper})

    act(() => {
      result.current.navigate({
        state: {
          scopedKey: 'scopedValue',
        },
        stickyParams: {
          stickyParam: 'newStickyValue',
        },
      })
    })

    expect(mockOnNavigate).toHaveBeenCalledWith({
      path: {
        _searchParams: [['stickyParam', 'newStickyValue']],
        tool: 'desk',
        testScope: {
          scopedKey: 'scopedValue',
        },
      },
    })
  })

  it('should keep the current state when navigating with explicitly undefined state', () => {
    const wrapper = createWrapper()
    const {result} = renderHook(() => useRouter(), {wrapper})

    act(() => {
      result.current.navigate({
        initialValue: 'test',
      })
    })

    mockOnNavigate.mockClear()

    act(() => {
      result.current.navigate({
        state: undefined,
        stickyParams: {
          stickyParam: 'newStickyValue',
        },
      })
    })

    expect(mockOnNavigate).toHaveBeenCalledWith({
      path: {
        _searchParams: [['stickyParam', 'newStickyValue']],
        tool: 'desk',
      },
      replace: undefined,
    })
  })

  it('should handle navigate with empty object state', () => {
    const wrapper = createWrapper()
    const {result} = renderHook(() => useRouter(), {wrapper})

    act(() => {
      result.current.navigate({
        state: {},
      })
    })

    expect(mockOnNavigate).toHaveBeenCalledWith({
      path: {
        _searchParams: [['stickyParam', 'stickyValue']],
        tool: 'desk',
        testScope: {},
      },
    })
  })
})
