import {describe, expect, it} from 'vitest'

import {regionOfShard} from './apiRegions'
import {locationOfTimeZone} from './timeZoneLocation'

describe('regionOfShard', () => {
  it('reads the Google Cloud region from the shard', () => {
    expect(regionOfShard('gcp-eu-w1-01-prod-1028')).toMatchObject({
      id: 'europe-west1',
      location: 'St. Ghislain, Belgium',
    })
    expect(regionOfShard('gcp-us-c1-02-prod-7')?.id).toBe('us-central1')
    expect(regionOfShard('gcp-as-se1-01-prod-3')?.id).toBe('asia-southeast1')
    expect(regionOfShard('gcp-au-se1-01-prod-3')?.id).toBe('australia-southeast1')
  })

  it('knows nothing about other shards', () => {
    expect(regionOfShard(undefined)).toBeUndefined()
    expect(regionOfShard('aws-eu-w1-01')).toBeUndefined()
    expect(regionOfShard('gcp-xx-w1-01-prod')).toBeUndefined()
    expect(regionOfShard('gcp-eu-w9-01-prod')).toBeUndefined()
  })
})

describe('locationOfTimeZone', () => {
  it('places the common zones at their city and others on their continent', () => {
    expect(locationOfTimeZone('Europe/Oslo')).toEqual({latitude: 59.91, longitude: 10.75})
    expect(locationOfTimeZone('Europe/Tallinn')).toEqual({latitude: 50, longitude: 10})
    expect(locationOfTimeZone('Etc/UTC')).toBeUndefined()
    expect(locationOfTimeZone(undefined)).toBeUndefined()
  })
})
