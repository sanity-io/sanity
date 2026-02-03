import {type Mocked, vitest} from 'vitest'

import {publishedReleaseEvents} from '../../events/__fixtures__/release-events'
import {type useReleaseEvents} from '../../events/useReleaseEvents'

export const useReleaseEventsMockReturn: Mocked<ReturnType<typeof useReleaseEvents>> = {
  loading: false,
  events: publishedReleaseEvents,
  hasMore: false,
  error: null,
  loadMore: vitest.fn(),
}
