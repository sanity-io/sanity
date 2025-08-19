import {type Mock, vi} from 'vitest'

import {type StudioReleaseDocument} from '../../../types'
import {useActiveReleases} from '../../useActiveReleases'

export const useActiveReleasesMockReturn = {
  data: [] as StudioReleaseDocument[],
  error: undefined as Error | undefined,
  loading: false,
  dispatch: vi.fn(),
}

export const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
