import {type Mock, type Mocked} from 'vitest'

import {useAllReleases} from '../../useAllReleases'

export const useAllReleasesMockReturn: Mocked<ReturnType<typeof useAllReleases>> = {
  data: [],
  error: undefined,
  loading: false,
}

export const mockUseAllReleases = useAllReleases as Mock<typeof useAllReleases>
