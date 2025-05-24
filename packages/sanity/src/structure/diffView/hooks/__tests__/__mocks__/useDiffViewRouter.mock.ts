import {type Mock, type Mocked, vi} from 'vitest'

import {type DiffViewRouter, useDiffViewRouter} from '../../useDiffViewRouter'

export const useDiffViewRouterMockReturn: Mocked<DiffViewRouter> = {
  navigateDiffView: vi.fn(),
  exitDiffView: vi.fn(),
}

export const mockUseDiffViewRouter = useDiffViewRouter as Mock<typeof useDiffViewRouter>
