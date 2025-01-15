import {type Mock, type Mocked} from 'vitest'

import {useAllReleases} from '../../useAllReleases'

export const useAllReleasesMockReturn: Mocked<ReturnType<typeof useAllReleases>> = {
  allReleases: [],
}

export const mockUseAllReleases = useAllReleases as Mock<typeof useAllReleases>
