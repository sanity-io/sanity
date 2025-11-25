import {type Mock, type Mocked} from 'vitest'

import {useArchivedReleases} from '../../useArchivedReleases'

export const useArchivedReleasesMockReturn: Mocked<ReturnType<typeof useArchivedReleases>> = {
  data: [],
  error: undefined,
  loading: false,
}

export const mockUseArchivedReleases = useArchivedReleases as Mock<typeof useArchivedReleases>
