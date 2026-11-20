import {type ReleaseDocument, type VersionInfoDocumentStub} from 'sanity'
import {describe, expect, it} from 'vitest'

import {CREATE_VARIANT_PARAM} from '../../../panes/document/constants'
import {getCreateVariantPaneParams} from '../getCreateVariantPaneParams'

const activeASAPRelease = {
  _id: '_.releases.rASAP',
  _type: 'system.release',
  _rev: 'rev',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  name: 'rASAP',
  state: 'active',
  metadata: {title: 'Spring launch', releaseType: 'asap'},
} as ReleaseDocument

const scheduledRelease = {
  ...activeASAPRelease,
  _id: '_.releases.rScheduled',
  name: 'rScheduled',
  state: 'scheduled',
  metadata: {title: 'Summer sale', releaseType: 'scheduled'},
} as ReleaseDocument

const GROUP_ID = 'book'
const GERMAN = '_.variants.german'

function version(
  id: string,
  system: Partial<VersionInfoDocumentStub['_system']> = {},
): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _type: 'book',
    _system: {group: {_ref: GROUP_ID, _weak: true}, ...system},
  }
}

const PUBLISHED = version(GROUP_ID)
const DEFAULT_IN_ASAP = version(`versions.${activeASAPRelease.name}.${GROUP_ID}`, {
  bundleId: activeASAPRelease.name,
  release: {_ref: activeASAPRelease._id, _weak: true},
})
const GERMAN_DRAFT = version('german-draft', {
  bundleId: 'drafts',
  variants: [{_ref: GERMAN, _key: 'german'}],
})
const GERMAN_IN_ASAP = version('german-asap', {
  bundleId: activeASAPRelease.name,
  release: {_ref: activeASAPRelease._id, _weak: true},
  variants: [{_ref: GERMAN, _key: 'german'}],
})

describe('getCreateVariantPaneParams', () => {
  it('asks for the variant to be created when it has no version in the release in view', () => {
    expect(
      getCreateVariantPaneParams({
        variantId: GERMAN,
        selectedPerspective: activeASAPRelease,
        versions: [PUBLISHED, DEFAULT_IN_ASAP, GERMAN_DRAFT],
      }),
    ).toEqual({[CREATE_VARIANT_PARAM]: GERMAN})
  })

  it('adds nothing when the variant already has a version in the release', () => {
    expect(
      getCreateVariantPaneParams({
        variantId: GERMAN,
        selectedPerspective: activeASAPRelease,
        versions: [PUBLISHED, GERMAN_DRAFT, GERMAN_IN_ASAP],
      }),
    ).toBeUndefined()
  })

  it('adds nothing for the Default audience', () => {
    expect(
      getCreateVariantPaneParams({
        variantId: null,
        selectedPerspective: activeASAPRelease,
        versions: [PUBLISHED],
      }),
    ).toBeUndefined()
  })

  it.each([
    ['Drafts', 'drafts'],
    ['Published', 'published'],
  ])('adds nothing in %s, which is not a release', (_name, selectedPerspective) => {
    expect(
      getCreateVariantPaneParams({variantId: GERMAN, selectedPerspective, versions: [PUBLISHED]}),
    ).toBeUndefined()
  })

  it('adds nothing in a scheduled release, which nothing can be added to', () => {
    expect(
      getCreateVariantPaneParams({
        variantId: GERMAN,
        selectedPerspective: scheduledRelease,
        versions: [PUBLISHED],
      }),
    ).toBeUndefined()
  })
})
