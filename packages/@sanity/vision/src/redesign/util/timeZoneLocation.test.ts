import {describe, expect, it} from 'vitest'

import {locationOfTimeZone, offsetLocation} from './timeZoneLocation'

describe('locationOfTimeZone', () => {
  it('names no place for UTC', () => {
    expect(locationOfTimeZone('UTC')).toBeUndefined()
  })
})

describe('offsetLocation', () => {
  it('stands on the meridian of the UTC offset', () => {
    expect(offsetLocation(0)).toEqual({latitude: 30, longitude: 0})
    // Central European Time is an hour ahead of UTC, which getTimezoneOffset writes as -60
    expect(offsetLocation(-60)).toEqual({latitude: 30, longitude: 15})
    expect(offsetLocation(300)).toEqual({latitude: 30, longitude: -75})
  })

  it('stays on the globe for the most extreme offsets', () => {
    expect(offsetLocation(-840).longitude).toBe(180)
  })
})
