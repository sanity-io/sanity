import {describe, expect, test} from 'vitest'

import {getInsidePresenceTranslateX} from '../StickyOverlay'

describe('getInsidePresenceTranslateX', () => {
  test('does not slide in-flow presence over field actions when near scrollport edge', () => {
    expect(
      getInsidePresenceTranslateX({
        nearTop: true,
        nearBottom: false,
        containerWidth: 1347,
        originalLeft: 1243,
        regionWidth: 25,
      }),
    ).toBe(0)
  })

  test('keeps translate X at zero when not near scrollport edge', () => {
    expect(
      getInsidePresenceTranslateX({
        nearTop: false,
        nearBottom: false,
      }),
    ).toBe(0)
  })
})
