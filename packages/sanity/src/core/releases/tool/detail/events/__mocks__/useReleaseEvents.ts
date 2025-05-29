import {type Mock, vi} from 'vitest'

import {publishedReleaseEvents} from '../__fixtures__/release-events'

export const useReleaseEventsMockReturn = {
  loading: false,
  events: publishedReleaseEvents,
  hasMore: false,
  error: null,
  loadMore: vi.fn(),
}

export const useReleaseEvents = vi.fn(() => useReleaseEventsMockReturn) as Mock<
  () => typeof useReleaseEventsMockReturn
>
