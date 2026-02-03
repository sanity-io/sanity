import {useReleaseCreator} from '../../useReleaseCreator'
import {type Mock} from 'vitest'

export interface UseReleaseCreatorMockReturn {
  createdBy: string | undefined
  loading: boolean
}

export const useReleaseCreatorMockReturn: UseReleaseCreatorMockReturn = {
  createdBy: undefined,
  loading: false,
}

export const mockUseReleaseCreator = useReleaseCreator as Mock<typeof useReleaseCreator>
