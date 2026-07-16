import {describe, expect, it} from 'vitest'

import {type ReleasesReducerState} from '../releases/store/reducer'
import {type VersionInfoDocumentStub} from '../releases/store/types'
import {resolveVersionRelease} from './resolveVersionRelease'

function createVersion(
  _id: string,
  system: Partial<VersionInfoDocumentStub['_system']> = {},
): VersionInfoDocumentStub {
  return {
    _id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _system: {
      group: {
        _ref: 'doc1',
        _weak: true,
      },
      ...system,
    },
  }
}

const releasesState: ReleasesReducerState = {
  releases: new Map([
    [
      '_.releases.rSummer',
      {
        _id: '_.releases.rSummer',
        _type: 'system.release',
        _rev: 'rev',
        _createdAt: '2026-01-01T00:00:00.000Z',
        _updatedAt: '2026-01-01T00:00:00.000Z',
        metadata: {title: 'Summer release'},
      },
    ],
  ]),
  state: 'loaded',
}

describe('resolveVersionRelease', () => {
  it('returns initialising when document is undefined', () => {
    expect(resolveVersionRelease(undefined, releasesState)).toEqual({
      release: undefined,
      state: 'initialising',
    })
  })

  it('classifies the base published document as published from _system', () => {
    expect(resolveVersionRelease(createVersion('doc1'), releasesState)).toEqual({
      ...releasesState,
      release: 'published',
      state: 'loaded',
    })
  })

  it('classifies the base draft as drafts from _system', () => {
    expect(
      resolveVersionRelease(createVersion('drafts.doc1', {bundleId: 'drafts'}), releasesState),
    ).toEqual({
      ...releasesState,
      release: 'drafts',
      state: 'loaded',
    })
  })

  it('classifies a draft variant as drafts from _system, not from its version id', () => {
    expect(
      resolveVersionRelease(
        createVersion('versions.varscope.doc1', {
          bundleId: 'drafts',
          variant: {_ref: '_.variants.a', _weak: true},
          scopeId: 'varscope',
        }),
        releasesState,
      ),
    ).toEqual({
      ...releasesState,
      release: 'drafts',
      state: 'loaded',
    })
  })

  it('classifies a published variant as published from _system', () => {
    expect(
      resolveVersionRelease(
        createVersion('variant-doc', {
          variant: {_ref: '_.variants.a', _weak: true},
        }),
        releasesState,
      ),
    ).toEqual({
      ...releasesState,
      release: 'published',
      state: 'loaded',
    })
  })

  it('classifies a release version from _system.release', () => {
    const releaseVersion = createVersion('versions.rSummer.doc1', {
      bundleId: 'rSummer',
      release: {_ref: '_.releases.rSummer', _weak: true},
      scopeId: 'rSummer',
    })

    expect(resolveVersionRelease(releaseVersion, releasesState)).toEqual({
      ...releasesState,
      release: releasesState.releases.get('_.releases.rSummer'),
      state: 'loaded',
    })
  })

  it('falls back to id-based classification when _system is missing', () => {
    expect(resolveVersionRelease({_id: 'drafts.doc1'}, releasesState)).toEqual({
      release: 'drafts',
      state: 'loaded',
    })

    expect(resolveVersionRelease({_id: 'doc1'}, releasesState)).toEqual({
      release: 'published',
      state: 'loaded',
    })

    expect(resolveVersionRelease({_id: 'versions.rSummer.doc1'}, releasesState)).toEqual({
      ...releasesState,
      release: releasesState.releases.get('_.releases.rSummer'),
      state: 'loaded',
    })
  })
})
