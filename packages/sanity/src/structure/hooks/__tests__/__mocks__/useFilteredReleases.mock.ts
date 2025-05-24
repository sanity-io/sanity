import {type Mock, type Mocked} from 'vitest'

import {useFilteredReleases as useFilteredReleasesFn} from '../../useFilteredReleases'

export const useFilteredReleasesMockReturn: Mocked<ReturnType<typeof useFilteredReleasesFn>> = {
  notCurrentReleases: [],
  currentReleases: [],
  inCreation: null,
}

export const mockUseFilteredReleases = useFilteredReleasesFn as unknown as Mock<
  typeof useFilteredReleasesFn
>
