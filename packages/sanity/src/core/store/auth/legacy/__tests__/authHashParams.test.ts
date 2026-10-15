import {describe, expect, it} from 'vitest'

import sanityManifest from '../../../../../../package.json' with {type: 'json'}
import {removeAuthHashParams} from '../authHashParams'

describe('removeAuthHashParams', () => {
  it('returns a hash without auth params unchanged', () => {
    expect(removeAuthHashParams('#a&&b')).toBe('#a&&b')
  })

  it('returns an empty hash unchanged', () => {
    expect(removeAuthHashParams('#')).toBe('#')
  })

  it('removes auth params and keeps the others', () => {
    expect(removeAuthHashParams('#sid=x&a=1')).toBe('#a=1')
  })
})

describe('sanityCliCapabilities', () => {
  // The CLI only adds the script that fills `__SANITY_AUTH_HASH_PARAMS__` when the installed
  // `sanity` package declares it reads that stash, so older studios keep the params in the hash.
  it('advertises the auth hash stash to the CLI', () => {
    expect(sanityManifest.sanityCliCapabilities).toEqual({authHashStash: 1})
  })
})
