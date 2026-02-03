import {useAllReleases} from '../../useAllReleases'
import {type Mock, type Mocked} from 'vitest'

export const useAllReleasesMockReturn: Mocked<ReturnType<typeof useAllReleases>> = {
  data: [],
  error: undefined,
  loading: false,
}

export const mockUseAllReleases = useAllReleases as Mock<typeof useAllReleases>
