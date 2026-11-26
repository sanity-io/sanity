import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {activeASAPRelease} from '../../releases/__fixtures__/release.fixture'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {type Meta} from '../machines/documentGroupInventoryMachine'
import {metaWithoutReleases} from './withoutReleases'

const GROUP_ID = 'book'

const SCHEDULED_DRAFT: ReleaseDocument = {
  ...activeASAPRelease,
  _id: '_.releases.rScheduledDraft',
  name: 'rScheduledDraft',
  metadata: {...activeASAPRelease.metadata, cardinality: 'one'},
}

function version(
  id: string,
  system: Partial<VersionInfoDocumentStub['_system']> = {},
): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    _type: 'book',
    _system: {group: {_ref: GROUP_ID, _weak: true}, ...system},
  }
}

const PUBLISHED = version(GROUP_ID)
const DRAFT = version(`drafts.${GROUP_ID}`)
const IN_RELEASE = version(`versions.${activeASAPRelease.name}.${GROUP_ID}`, {
  bundleId: activeASAPRelease.name,
})
const IN_SCHEDULED_DRAFT = version(`versions.${SCHEDULED_DRAFT.name}.${GROUP_ID}`, {
  bundleId: SCHEDULED_DRAFT.name,
})
const VARIANT_IN_RELEASE = version(`versions.scope1.${GROUP_ID}`, {
  release: {_ref: activeASAPRelease._id, _weak: true},
  variants: [{_ref: '_.variants.nordic', _key: 'nordic'}],
})
const VARIANT_DRAFT = version(`versions.scope2.${GROUP_ID}`, {
  variants: [{_ref: '_.variants.nordic', _key: 'nordic'}],
})

const VERSIONS = [
  PUBLISHED,
  DRAFT,
  IN_RELEASE,
  IN_SCHEDULED_DRAFT,
  VARIANT_IN_RELEASE,
  VARIANT_DRAFT,
]

const META: Meta = {
  versionState: {data: VERSIONS.map(({_id}) => _id), versions: VERSIONS, loading: false},
  releases: {
    releases: new Map([
      [activeASAPRelease._id, activeASAPRelease],
      [SCHEDULED_DRAFT._id, SCHEDULED_DRAFT],
    ]),
    state: 'loaded',
  },
  variants: {variants: new Map(), state: 'loaded'},
  agentBundles: {bundles: [], loading: false},
}

describe('metaWithoutReleases', () => {
  it('keeps only scheduled drafts among the releases', () => {
    expect([...metaWithoutReleases(META).releases.releases.keys()]).toEqual([SCHEDULED_DRAFT._id])
  })

  it('leaves out the versions in releases, variants included', () => {
    const {versionState} = metaWithoutReleases(META)
    const kept = [PUBLISHED, DRAFT, IN_SCHEDULED_DRAFT, VARIANT_DRAFT].map(({_id}) => _id)
    expect(versionState.versions.map(({_id}) => _id)).toEqual(kept)
    expect(versionState.data).toEqual(kept)
  })
})
