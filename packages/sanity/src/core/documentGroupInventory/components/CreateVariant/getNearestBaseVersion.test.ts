import {describe, expect, it} from 'vitest'

import {activeASAPRelease} from '../../../releases/__fixtures__/release.fixture'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {getNearestBaseVersion} from './getNearestBaseVersion'

const GROUP_ID = 'document'
const SUMMER_SALE = '_.variants.summer-sale'

function version(
  id: string,
  system: Partial<VersionInfoDocumentStub['_system']> = {},
): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _type: 'author',
    _system: {group: {_ref: GROUP_ID, _weak: true}, ...system},
  }
}

const PUBLISHED = version(GROUP_ID)
const DRAFT = version(`drafts.${GROUP_ID}`, {bundleId: 'drafts'})
const IN_ASAP = version(`versions.${activeASAPRelease.name}.${GROUP_ID}`, {
  bundleId: activeASAPRelease.name,
  release: {_ref: activeASAPRelease._id, _weak: true},
})
const SUMMER_SALE_PUBLISHED = version('summer-sale-published', {
  variants: [{_ref: SUMMER_SALE, _key: 'summer-sale'}],
})
const SUMMER_SALE_DRAFT = version('summer-sale-draft', {
  bundleId: 'drafts',
  variants: [{_ref: SUMMER_SALE, _key: 'summer-sale'}],
})

const ASAP = {type: 'release', releaseId: activeASAPRelease._id} as const

describe('getNearestBaseVersion', () => {
  it('starts from the published version of the variant', () => {
    const versions = [PUBLISHED, DRAFT, IN_ASAP, SUMMER_SALE_PUBLISHED]

    expect(
      getNearestBaseVersion({variantId: SUMMER_SALE, bundle: {type: 'drafts'}, versions}),
    ).toBe(SUMMER_SALE_PUBLISHED)
    expect(getNearestBaseVersion({variantId: SUMMER_SALE, bundle: ASAP, versions})).toBe(
      SUMMER_SALE_PUBLISHED,
    )
  })

  it('starts a draft from the default draft, then the default published version', () => {
    expect(
      getNearestBaseVersion({
        variantId: SUMMER_SALE,
        bundle: {type: 'drafts'},
        versions: [PUBLISHED, DRAFT, SUMMER_SALE_DRAFT],
      }),
    ).toBe(DRAFT)

    expect(
      getNearestBaseVersion({
        variantId: SUMMER_SALE,
        bundle: {type: 'drafts'},
        versions: [PUBLISHED, IN_ASAP],
      }),
    ).toBe(PUBLISHED)

    // Nothing to start from: the variant starts empty.
    expect(
      getNearestBaseVersion({
        variantId: SUMMER_SALE,
        bundle: {type: 'drafts'},
        versions: [IN_ASAP, SUMMER_SALE_DRAFT],
      }),
    ).toBeUndefined()
  })

  it('starts a release version from the default version in that release only', () => {
    expect(
      getNearestBaseVersion({variantId: SUMMER_SALE, bundle: ASAP, versions: [DRAFT, IN_ASAP]}),
    ).toBe(IN_ASAP)

    expect(
      getNearestBaseVersion({variantId: SUMMER_SALE, bundle: ASAP, versions: [PUBLISHED, DRAFT]}),
    ).toBeUndefined()
  })

  it('starts from the default version of the bundle while no variant is picked', () => {
    const versions = [PUBLISHED, DRAFT, IN_ASAP, SUMMER_SALE_PUBLISHED]

    expect(getNearestBaseVersion({variantId: undefined, bundle: {type: 'drafts'}, versions})).toBe(
      DRAFT,
    )
    expect(getNearestBaseVersion({variantId: undefined, bundle: ASAP, versions})).toBe(IN_ASAP)
  })
})
