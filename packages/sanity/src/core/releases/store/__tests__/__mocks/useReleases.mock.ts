import {type Mocked, vi} from 'vitest'

import {type useReleases} from '../../useReleases'

export const useReleasesMock: Mocked<ReturnType<typeof useReleases>> = {
  archivedReleases: [],
  data: [],
  dispatch: vi.fn(),
  error: undefined,
  loading: false,
  releasesIds: [],
}
