import {type RouterContextValue} from '../types'
import {type Mock, type Mocked, vi} from 'vitest'

export const mockUseRouterReturn: Mocked<RouterContextValue> = {
  state: {
    _searchParams: [],
  },
  navigate: vi.fn(),
  resolvePathFromState: vi.fn(),
  resolveIntentLink: vi.fn(),
  navigateUrl: vi.fn(),
  navigateStickyParams: vi.fn(),
  navigateIntent: vi.fn(),
  stickyParams: {},
}

export const useRouter = vi.fn(() => mockUseRouterReturn) as Mock<() => RouterContextValue> 