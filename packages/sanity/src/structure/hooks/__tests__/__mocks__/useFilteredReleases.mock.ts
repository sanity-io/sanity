import {type Mock, type Mocked} from 'vitest'

import {type useFilteredReleases as useFilteredReleasesFn} from '../../useFilteredReleases'

export const useFilteredReleasesMockReturn: Mocked<ReturnType<typeof useFilteredReleasesFn>> = {
  currentReleases: [],
  notCurrentReleases: [],
  inCreation: null,
}

export const mockUseFilteredReleases = useFilteredReleasesFn as Mock<typeof useFilteredReleasesFn>
