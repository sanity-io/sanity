import {useArchivedReleases} from '../../useArchivedReleases'
import {type Mock, type Mocked} from 'vitest'

export const useArchivedReleasesMockReturn: Mocked<ReturnType<typeof useArchivedReleases>> = {
  data: [],
  error: undefined,
  loading: false,
}

export const mockUseArchivedReleases = useArchivedReleases as Mock<typeof useArchivedReleases>
