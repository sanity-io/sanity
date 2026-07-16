import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../store/types'
import {getVersionContextMenuParams} from './getVersionContextMenuParams'

const PUBLISHED_ID = 'article-1'
const groupRef = {_type: 'reference' as const, _ref: PUBLISHED_ID, _weak: true}
const variantRef = (variantId: string) =>
  ({_type: 'reference' as const, _ref: variantId, _weak: true}) as const

const versionStub = (
  stub: Pick<VersionInfoDocumentStub, '_id' | '_system'>,
): VersionInfoDocumentStub => ({
  _rev: '',
  _createdAt: '',
  _updatedAt: '',
  ...stub,
})

describe('getVersionContextMenuParams', () => {
  it('derives params for a published document', () => {
    const stub = versionStub({
      _id: PUBLISHED_ID,
      _system: {group: groupRef},
    })

    expect(getVersionContextMenuParams(stub)).toEqual({
      documentId: PUBLISHED_ID,
      bundleId: 'published',
      isVersion: false,
      isPublished: true,
      permissionVersion: undefined,
      permission: 'discardVersion',
    })
  })

  it('derives params for a base draft', () => {
    const stub = versionStub({
      _id: `drafts.${PUBLISHED_ID}`,
      _system: {bundleId: 'drafts', group: groupRef},
    })

    expect(getVersionContextMenuParams(stub)).toEqual({
      documentId: PUBLISHED_ID,
      bundleId: 'draft',
      isVersion: false,
      isPublished: false,
      permissionVersion: undefined,
      permission: 'discardDraft',
    })
  })

  it('derives params for a release version', () => {
    const stub = versionStub({
      _id: `versions.rSummer.${PUBLISHED_ID}`,
      _system: {
        bundleId: 'rSummer',
        release: {_ref: '_.releases.rSummer', _weak: true},
        group: groupRef,
        scopeId: 'rSummer',
      },
    })

    expect(getVersionContextMenuParams(stub)).toEqual({
      documentId: PUBLISHED_ID,
      bundleId: 'rSummer',
      isVersion: true,
      isPublished: false,
      permissionVersion: 'rSummer',
      permission: 'discardVersion',
    })
  })

  it('derives params for a variant draft using scopeId for permissions', () => {
    const stub = versionStub({
      _id: `versions.varscope.${PUBLISHED_ID}`,
      _system: {
        bundleId: 'drafts',
        variant: variantRef('_.variants.alpha'),
        group: groupRef,
        scopeId: 'varscope',
      },
    })

    expect(getVersionContextMenuParams(stub)).toEqual({
      documentId: PUBLISHED_ID,
      bundleId: 'varscope',
      isVersion: true,
      isPublished: false,
      permissionVersion: 'varscope',
      permission: 'discardVersion',
    })
  })
})
