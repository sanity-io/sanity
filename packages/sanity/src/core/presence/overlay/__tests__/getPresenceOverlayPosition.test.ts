import {describe, expect, test} from 'vitest'

import {getPresenceOverlayPosition} from '../getPresenceOverlayPosition'

describe('getPresenceOverlayPosition', () => {
  test('keeps a visible title field in-flow instead of docking over field actions', () => {
    expect(
      getPresenceOverlayPosition({
        presenceTop: 207,
        presenceBottom: 232,
        scrollportTop: 200,
        scrollportBottom: 850,
      }),
    ).toBe('inside')
  })

  test('docks when the field has scrolled out above the scrollport', () => {
    expect(
      getPresenceOverlayPosition({
        presenceTop: 100,
        presenceBottom: 125,
        scrollportTop: 200,
        scrollportBottom: 850,
      }),
    ).toBe('top')
  })

  test('docks when the field has scrolled out below the scrollport', () => {
    expect(
      getPresenceOverlayPosition({
        presenceTop: 860,
        presenceBottom: 885,
        scrollportTop: 200,
        scrollportBottom: 850,
      }),
    ).toBe('bottom')
  })
})
