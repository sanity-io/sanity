import {Subject} from 'rxjs'
import {type Mock, type Mocked, vi} from 'vitest'

import {type usePathSyncChannel as usePathSyncChannelFn} from '../../usePathSyncChannel'

export const usePathSyncChannelMockReturn: Mocked<ReturnType<typeof usePathSyncChannelFn>> = {
  push: vi.fn(),
  path: new Subject(),
}

export const mockUsePathSyncChannel = (
  usePathSyncChannelFn as unknown as Mock<typeof usePathSyncChannelFn>
)
