import {type RouterContextValue, useRouter} from 'sanity/router'
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

export const mockUseRouter = useRouter as Mock<typeof useRouter>
