import {describe, expect, it} from 'vitest'

import {currentUnixTime} from '../../utils'
import {addVersion} from '../addVersion'

describe('addVersion()', () => {
  it('adds a new version to the version array', () => {
    const version = {timestamp: currentUnixTime(), version: '1.2.3'}
    expect(addVersion({versions: []}, version)).toEqual({
      versions: [version],
    })
  })

  it('replaces any existing version in case it already exists', () => {
    const now = currentUnixTime()
    const newVersion = {timestamp: now, version: '1.2.3'}
    const existingVersion = {timestamp: now - 1000, version: '1.2.3'}
    expect(addVersion({versions: [existingVersion]}, newVersion)).toEqual({
      versions: [newVersion],
    })
  })
})
