import {type Mock, type Mocked, vi} from 'vitest'

import {useActiveReleases} from '../../useActiveReleases'

export const useActiveReleasesMockReturn: Mocked<ReturnType<typeof useActiveReleases>> = {
  data: [],
  dispatch: vi.fn(),
  error: undefined,
  loading: false,
}

export const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
