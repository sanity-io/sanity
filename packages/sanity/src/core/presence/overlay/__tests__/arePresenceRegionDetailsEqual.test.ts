import {describe, expect, test} from 'vitest'

import {type RegionWithIntersectionDetails} from '../../types'
import {arePresenceRegionDetailsEqual} from '../arePresenceRegionDetailsEqual'

function detail(
  overrides: Partial<RegionWithIntersectionDetails> & {id?: string} = {},
): RegionWithIntersectionDetails {
  const {id = 'title', ...rest} = overrides
  const region: RegionWithIntersectionDetails['region'] = {
    id,
    element: null,
    presence: [],
    maxAvatars: 3,
    rect: {top: 0, left: 0, width: 25, height: 25},
  }
  return {
    distanceTop: 40,
    distanceBottom: 80,
    position: 'inside',
    region,
    ...rest,
  }
}

describe('arePresenceRegionDetailsEqual', () => {
  test('treats the same array reference as equal', () => {
    const regions = [detail()]
    expect(arePresenceRegionDetailsEqual(regions, regions)).toBe(true)
  })

  test('ignores sub-pixel distance jitter for the same region and position', () => {
    expect(
      arePresenceRegionDetailsEqual([detail({distanceTop: 40.2})], [detail({distanceTop: 40.4})]),
    ).toBe(true)
  })

  test('detects a dock position change', () => {
    expect(
      arePresenceRegionDetailsEqual([detail({position: 'inside'})], [detail({position: 'top'})]),
    ).toBe(false)
  })
})
