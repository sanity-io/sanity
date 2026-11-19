import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {type VersionStub} from '../../../../inventoryModel/types'
import {type VariantId} from '../../../types'
import {
  DEFAULT_DEFINITION,
  filterVersions,
  getReleaseOptions,
  getVersionLinkTarget,
  orderVersions,
  VERSION_INVENTORY_INSPECTOR_NAME,
} from '../versionRows'

const GERMAN = '_.variants.german' as VariantId
const SPRING = '_.releases.rSpring'

function row(overrides: Partial<VersionStub> & Pick<VersionStub, '_id' | 'groupId'>): VersionStub {
  return {
    _type: 'product',
    _updatedAt: '2026-11-01T00:00:00Z',
    variantId: undefined,
    kind: 'published',
    bundle: 'published',
    goingToUnpublish: false,
    ...overrides,
  }
}

// In the shared version order, as documentLens returns them.
const rows: VersionStub[] = [
  row({_id: 'boots', groupId: 'boots', _updatedAt: '2026-11-03T00:00:00Z'}),
  row({_id: 'jacket', groupId: 'jacket', _updatedAt: '2026-11-01T00:00:00Z'}),
  row({
    _id: 'drafts.jacket',
    groupId: 'jacket',
    kind: 'draft',
    bundle: 'drafts',
    _updatedAt: '2026-11-05T00:00:00Z',
  }),
  row({
    _id: 'versions.german.boots',
    groupId: 'boots',
    kind: 'draft',
    bundle: 'drafts',
    variantId: GERMAN,
    _updatedAt: '2026-11-04T00:00:00Z',
  }),
  row({
    _id: 'versions.rSpring.jacket',
    groupId: 'jacket',
    kind: 'release',
    bundle: SPRING,
    _updatedAt: '2026-11-02T00:00:00Z',
  }),
]

const ids = (list: VersionStub[]) => list.map((item) => item._id)

describe('filterVersions', () => {
  it('filters by definition, including Default', () => {
    expect(ids(filterVersions(rows, {definition: GERMAN}))).toEqual(['versions.german.boots'])
    expect(filterVersions(rows, {definition: DEFAULT_DEFINITION})).toHaveLength(4)
  })

  it('filters by release and by state, and combines filters', () => {
    expect(ids(filterVersions(rows, {release: SPRING}))).toEqual(['versions.rSpring.jacket'])
    expect(ids(filterVersions(rows, {state: 'draft'}))).toEqual([
      'drafts.jacket',
      'versions.german.boots',
    ])
    expect(ids(filterVersions(rows, {state: 'draft', definition: DEFAULT_DEFINITION}))).toEqual([
      'drafts.jacket',
    ])
  })
})

describe('orderVersions', () => {
  it('keeps the shared version order, or puts the last edit first', () => {
    expect(ids(orderVersions(rows, {sort: 'version-order', grouping: 'none'}))).toEqual(ids(rows))
    expect(ids(orderVersions(rows, {sort: 'last-edited', grouping: 'none'}))).toEqual([
      'drafts.jacket',
      'versions.german.boots',
      'boots',
      'versions.rSpring.jacket',
      'jacket',
    ])
  })

  it('groups by document, groups in the order of their first row', () => {
    expect(ids(orderVersions(rows, {sort: 'last-edited', grouping: 'document'}))).toEqual([
      'drafts.jacket',
      'versions.rSpring.jacket',
      'jacket',
      'versions.german.boots',
      'boots',
    ])
  })

  it('groups by definition with Default first', () => {
    expect(ids(orderVersions(rows, {sort: 'last-edited', grouping: 'definition'}))).toEqual([
      'drafts.jacket',
      'boots',
      'versions.rSpring.jacket',
      'jacket',
      'versions.german.boots',
    ])
  })
})

describe('getReleaseOptions', () => {
  it('lists the releases that hold a row, with their titles', () => {
    const releases = new Map([
      [SPRING, {_id: SPRING, metadata: {title: 'Spring'}} as ReleaseDocument],
    ])
    expect(getReleaseOptions(rows, releases)).toEqual([{id: SPRING, title: 'Spring'}])
    expect(getReleaseOptions(rows, new Map())).toEqual([{id: SPRING, title: 'rSpring'}])
  })
})

describe('getVersionLinkTarget', () => {
  it('opens the document on the version, with the version inventory open', () => {
    const published = getVersionLinkTarget(rows[1]!)
    expect(published.params).toEqual({
      id: 'jacket',
      type: 'product',
      inspect: VERSION_INVENTORY_INSPECTOR_NAME,
    })
    expect(published.searchParams).toEqual([['perspective', 'published']])

    expect(getVersionLinkTarget(rows[2]!).searchParams).toEqual([])

    const inRelease = getVersionLinkTarget(rows[4]!)
    expect(inRelease.searchParams).toEqual([['perspective', 'rSpring']])
    expect(inRelease.perspectiveStack).toEqual(['rSpring', 'drafts'])

    expect(getVersionLinkTarget(rows[3]!).searchParams).toEqual([['variant', 'variant:german']])
  })

  it('names the same inspector as the structure document pane', () => {
    expect(VERSION_INVENTORY_INSPECTOR_NAME).toBe('sanity/structure/document-group')
  })
})
