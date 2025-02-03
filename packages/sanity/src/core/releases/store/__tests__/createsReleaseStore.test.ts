import {describe, expect, it} from 'vitest'

import {NO_EMISSION} from '../../../../../test/matchers/toMatchEmissions'
import {
  activeUndecidedErrorRelease,
  activeUndecidedRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
  scheduledRelease,
} from '../../__fixtures__/release.fixture'
import {releaseStoreErrorCount} from '../createReleaseStore'

describe('releaseStoreErrorCount', () => {
  it('emits the count of releases in an error state when the count changes', async () => {
    await expect(releaseStoreErrorCount).toMatchEmissions([
      [
        {
          releases: new Map([['a', activeUndecidedRelease]]),
          state: 'loaded',
        },
        0,
      ],
      [
        {
          releases: new Map([
            ['a', activeUndecidedErrorRelease],
            ['b', activeUndecidedErrorRelease],
          ]),
          state: 'loaded',
        },
        2,
      ],
      [
        {
          releases: new Map([
            ['a', activeUndecidedErrorRelease],
            ['b', activeUndecidedErrorRelease],
            ['c', archivedScheduledRelease],
            ['d', publishedASAPRelease],
          ]),
          state: 'loaded',
        },
        NO_EMISSION,
      ],
      [
        {
          releases: new Map([
            ['a', activeUndecidedErrorRelease],
            ['b', activeUndecidedErrorRelease],
            ['c', publishedASAPRelease],
            ['d', activeUndecidedErrorRelease],
            ['e', activeUndecidedErrorRelease],
            ['f', scheduledRelease],
          ]),
          state: 'loaded',
        },
        4,
      ],
      [
        {
          releases: new Map(),
          state: 'loaded',
        },
        0,
      ],
      [
        {
          releases: new Map(),
          state: 'loaded',
        },
        NO_EMISSION,
      ],
    ])
  })
})
