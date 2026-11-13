import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {
  activeASAPRelease,
  activeUndecidedRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
  scheduledRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {type Variant} from '../../machines/selectionMachine'
import {getAvailableBundles, getBundleKey} from './getAvailableBundles'

const GROUP_ID = 'document'
const SUMMER_SALE = '_.variants.summer-sale'

const RELEASES = new Map<string, ReleaseDocument>(
  [
    activeASAPRelease,
    activeUndecidedRelease,
    archivedScheduledRelease,
    publishedASAPRelease,
    scheduledRelease,
  ].map((release) => [release._id, release]),
)

function version(id: string, system: Partial<Variant['document']['_system']>): Variant {
  return {
    id,
    name: id,
    document: {
      _id: id,
      _rev: 'rev',
      _createdAt: '2026-01-01T00:00:00.000Z',
      _updatedAt: '2026-01-01T00:00:00.000Z',
      _type: 'author',
      _system: {group: {_ref: GROUP_ID, _weak: true}, ...system},
    },
  }
}

function summerSaleIn(bundleId: string): Variant {
  return version(`versions.${bundleId}.${GROUP_ID}`, {
    bundleId,
    variants: [{_ref: SUMMER_SALE, _key: 'summer-sale'}],
  })
}

describe('getAvailableBundles', () => {
  it('offers drafts, then the open releases', () => {
    const bundles = getAvailableBundles({
      variantId: SUMMER_SALE,
      releases: RELEASES,
      existingVariants: [],
    })

    expect(bundles.map(getBundleKey)).toEqual([
      'drafts',
      activeASAPRelease._id,
      activeUndecidedRelease._id,
    ])
  })

  it('leaves out the bundles already holding the variant', () => {
    const bundles = getAvailableBundles({
      variantId: SUMMER_SALE,
      releases: RELEASES,
      existingVariants: [summerSaleIn('drafts'), summerSaleIn(activeASAPRelease.name)],
    })

    expect(bundles.map(getBundleKey)).toEqual([activeUndecidedRelease._id])
  })

  it('ignores the bundles holding other variants', () => {
    const bundles = getAvailableBundles({
      variantId: '_.variants.vip-users',
      releases: RELEASES,
      existingVariants: [summerSaleIn('drafts'), summerSaleIn(activeASAPRelease.name)],
    })

    expect(bundles.map(getBundleKey)).toEqual([
      'drafts',
      activeASAPRelease._id,
      activeUndecidedRelease._id,
    ])
  })
})
