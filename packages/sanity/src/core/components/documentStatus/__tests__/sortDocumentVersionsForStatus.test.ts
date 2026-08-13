import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {type SystemVariant} from '../../../variants/types'
import {groupDocumentVersionsForStatus} from '../sortDocumentVersionsForStatus'

const GROUP_ID = 'article-1'

function createVersion({
  id,
  bundleId,
  createdAt,
  updatedAt,
  releaseRef,
  variantRef,
}: {
  id: string
  bundleId?: string
  createdAt: string
  updatedAt: string
  releaseRef?: string
  variantRef?: string
}): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: `${id}-rev`,
    _createdAt: createdAt,
    _updatedAt: updatedAt,
    _system: {
      bundleId,
      group: {_ref: GROUP_ID, _weak: true},
      release: releaseRef ? {_ref: releaseRef, _weak: true} : undefined,
      variant: variantRef ? {_ref: variantRef, _weak: true} : undefined,
    },
  }
}

const variantReturning: SystemVariant = {
  _id: '_.variants.returning',
  _type: 'system.variant',
  _createdAt: '2025-01-01T00:00:00Z',
  _updatedAt: '2025-01-01T00:00:00Z',
  _rev: 'variant-returning-rev',
  conditions: {},
  priority: 0,
  metadata: {title: 'Returning visitors'},
}

const variantFirstTime: SystemVariant = {
  _id: '_.variants.first-time',
  _type: 'system.variant',
  _createdAt: '2025-01-01T00:00:00Z',
  _updatedAt: '2025-01-01T00:00:00Z',
  _rev: 'variant-first-time-rev',
  conditions: {},
  priority: 0,
  metadata: {title: 'First-time visitors'},
}

const releaseSummer = {
  _id: '_.releases.rSummer',
  _type: 'system.release',
  _createdAt: '2025-01-01T00:00:00Z',
  _updatedAt: '2025-01-01T00:00:00Z',
  _rev: 'release-summer-rev',
  name: 'rSummer',
  metadata: {
    title: 'Summer Campaign',
    releaseType: 'scheduled',
  },
  state: 'active',
} as const

const releaseHalloween = {
  _id: '_.releases.rHalloween',
  _type: 'system.release',
  _createdAt: '2025-01-02T00:00:00Z',
  _updatedAt: '2025-01-02T00:00:00Z',
  _rev: 'release-halloween-rev',
  name: 'rHalloween',
  metadata: {
    title: 'Halloween',
    releaseType: 'scheduled',
  },
  state: 'active',
} as const

const releaseAsap = {
  _id: '_.releases.rASAP',
  _type: 'system.release',
  _createdAt: '2025-01-03T00:00:00Z',
  _updatedAt: '2025-01-03T00:00:00Z',
  _rev: 'release-asap-rev',
  name: 'rASAP',
  metadata: {
    title: 'ASAP',
    releaseType: 'asap',
  },
  state: 'active',
} as const

describe('groupDocumentVersionsForStatus', () => {
  it('groups default variant first, then sorts variants by id', () => {
    const groups = groupDocumentVersionsForStatus(
      [
        createVersion({
          id: 'drafts.first-time.article-1',
          bundleId: 'drafts',
          createdAt: '2025-06-01T00:00:00Z',
          updatedAt: '2025-06-01T00:00:00Z',
          variantRef: variantFirstTime._id,
        }),
        createVersion({
          id: 'article-1',
          createdAt: '2025-06-02T00:00:00Z',
          updatedAt: '2025-06-02T00:00:00Z',
        }),
        createVersion({
          id: 'drafts.returning.article-1',
          bundleId: 'drafts',
          createdAt: '2025-06-01T00:00:00Z',
          updatedAt: '2025-06-01T00:00:00Z',
          variantRef: variantReturning._id,
        }),
      ],
      [],
      new Map([
        [variantReturning._id, variantReturning],
        [variantFirstTime._id, variantFirstTime],
      ]),
    )

    expect(groups.map((group) => group.variantId)).toEqual([
      undefined,
      variantFirstTime._id,
      variantReturning._id,
    ])
  })

  it('sorts bundles within a variant as published, drafts, then releases by title', () => {
    const groups = groupDocumentVersionsForStatus(
      [
        createVersion({
          id: 'versions.rASAP.scope.article-1',
          bundleId: 'rASAP',
          createdAt: '2025-06-04T00:00:00Z',
          updatedAt: '2025-06-04T00:00:00Z',
          releaseRef: releaseAsap._id,
          variantRef: variantReturning._id,
        }),
        createVersion({
          id: 'drafts.returning.article-1',
          bundleId: 'drafts',
          createdAt: '2025-06-01T00:00:00Z',
          updatedAt: '2025-06-01T00:00:00Z',
          variantRef: variantReturning._id,
        }),
        createVersion({
          id: 'published.scope.article-1',
          createdAt: '2025-06-03T00:00:00Z',
          updatedAt: '2025-06-03T00:00:00Z',
          variantRef: variantReturning._id,
        }),
        createVersion({
          id: 'versions.rSummer.scope.article-1',
          bundleId: 'rSummer',
          createdAt: '2025-06-02T00:00:00Z',
          updatedAt: '2025-06-02T00:00:00Z',
          releaseRef: releaseSummer._id,
        }),
        createVersion({
          id: 'versions.rHalloween.scope.article-1',
          bundleId: 'rHalloween',
          createdAt: '2025-06-05T00:00:00Z',
          updatedAt: '2025-06-05T00:00:00Z',
          releaseRef: releaseHalloween._id,
          variantRef: variantReturning._id,
        }),
      ],
      [releaseSummer, releaseHalloween, releaseAsap],
      new Map([
        [variantReturning._id, variantReturning],
        [variantFirstTime._id, variantFirstTime],
      ]),
    )

    expect(groups[0]?.items.map((item) => item.version._id)).toEqual([
      'versions.rSummer.scope.article-1',
    ])
    expect(groups[1]?.items.map((item) => item.version._id)).toEqual([
      'published.scope.article-1',
      'drafts.returning.article-1',
      'versions.rHalloween.scope.article-1',
      'versions.rASAP.scope.article-1',
    ])
  })
})
