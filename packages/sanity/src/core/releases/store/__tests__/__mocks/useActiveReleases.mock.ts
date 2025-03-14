import {vi} from 'vitest'

import {type ReleaseDocument} from '../../types'

export const useActiveReleasesMockReturn = {
  data: [] as ReleaseDocument[],
  error: undefined as Error | undefined,
  loading: false,
  dispatch: vi.fn(),
}

export const mockUseActiveReleases = vi.fn().mockReturnValue(useActiveReleasesMockReturn)
