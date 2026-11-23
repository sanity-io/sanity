import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {activeASAPRelease, archivedScheduledRelease} from '../releases/__fixtures__/release.fixture'
import {resolveStickyPerspectiveName} from './resolveStickyPerspectiveName'

const SCHEDULED_DRAFT: ReleaseDocument = {
  ...activeASAPRelease,
  _id: '_.releases.rScheduledDraft',
  name: 'rScheduledDraft',
  metadata: {...activeASAPRelease.metadata, cardinality: 'one'},
}

const BASE = {
  activeReleases: [activeASAPRelease, SCHEDULED_DRAFT],
  archivedReleases: [archivedScheduledRelease],
  releasesLoading: false,
  releasesEnabled: true,
  isDraftModelEnabled: true,
}

describe('resolveStickyPerspectiveName', () => {
  it('keeps published and a known release', () => {
    expect(resolveStickyPerspectiveName({...BASE, perspective: 'published'})).toEqual({
      name: 'published',
    })
    expect(resolveStickyPerspectiveName({...BASE, perspective: activeASAPRelease.name})).toEqual({
      name: activeASAPRelease.name,
    })
  })

  it('reads drafts as the default, or as published when drafts are off', () => {
    expect(resolveStickyPerspectiveName({...BASE, perspective: 'drafts'})).toEqual({
      name: undefined,
    })
    expect(
      resolveStickyPerspectiveName({...BASE, perspective: 'drafts', isDraftModelEnabled: false}),
    ).toEqual({name: 'published', ignored: 'drafts'})
  })

  it('falls back to the default for a release that does not exist', () => {
    expect(resolveStickyPerspectiveName({...BASE, perspective: 'BlackFriday'})).toEqual({
      name: undefined,
      ignored: 'unknown-release',
    })
  })

  it('keeps an unknown release while the releases are loading', () => {
    expect(
      resolveStickyPerspectiveName({...BASE, perspective: 'rSoon', releasesLoading: true}),
    ).toEqual({name: 'rSoon'})
  })

  it('leaves archived releases to the archived reset', () => {
    expect(
      resolveStickyPerspectiveName({...BASE, perspective: archivedScheduledRelease.name}),
    ).toEqual({name: archivedScheduledRelease.name})
  })

  it('with releases off, keeps scheduled drafts only', () => {
    const off = {...BASE, releasesEnabled: false}
    expect(resolveStickyPerspectiveName({...off, perspective: activeASAPRelease.name})).toEqual({
      name: undefined,
      ignored: 'releases-off',
    })
    expect(resolveStickyPerspectiveName({...off, perspective: SCHEDULED_DRAFT.name})).toEqual({
      name: SCHEDULED_DRAFT.name,
    })
  })
})
