import {type Mock, type Mocked, vi} from 'vitest'

import {useReleases} from '../../useReleases'

export const useReleasesMockReturn: Mocked<ReturnType<typeof useReleases>> = {
  data: [],
  dispatch: vi.fn(),
  error: undefined,
  loading: false,
}

export const mockUseReleases = useReleases as Mock<typeof useReleases>
