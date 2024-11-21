import {type Mock, type Mocked, vi} from 'vitest'

import {type RouterContextValue} from '../../types'
import {useRouter} from '../../useRouter'

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
