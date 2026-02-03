import {useActiveReleases} from '../../useActiveReleases'
import {type ReleaseDocument} from '@sanity/client'
import {type Mock, vi} from 'vitest'

export const useActiveReleasesMockReturn = {
  data: [] as ReleaseDocument[],
  error: undefined as Error | undefined,
  loading: false,
  dispatch: vi.fn(),
}

export const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
