import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {hasMoreInInventory} from '../hasMoreInInventory'
import {type DocumentVersionStatusGroup} from '../sortDocumentVersionsForStatus'

const GROUP_ID = 'article-1'

function version(id: string, bundleId?: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'article',
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-10-22T11:00:00.000Z',
    _system: {bundleId, group: {_ref: GROUP_ID, _weak: true}},
  }
}

const published = version(GROUP_ID)
const draft = version(`drafts.${GROUP_ID}`, 'drafts')
const inRelease = version(`versions.rASAP.${GROUP_ID}`, 'rASAP')

describe('hasMoreInInventory', () => {
  it('is false for a document with only Published and Draft', () => {
    const groups: DocumentVersionStatusGroup[] = [{items: [{version: published}, {version: draft}]}]
    expect(hasMoreInInventory(groups, 0)).toBe(false)
  })

  it('is false for a draft alone and for a published version alone', () => {
    expect(hasMoreInInventory([{items: [{version: draft}]}], 0)).toBe(false)
    expect(hasMoreInInventory([{items: [{version: published}]}], 0)).toBe(false)
  })

  it('is true when the document has a release version', () => {
    const groups: DocumentVersionStatusGroup[] = [
      {items: [{version: published}, {version: draft}, {version: inRelease}]},
    ]
    expect(hasMoreInInventory(groups, 0)).toBe(true)
  })

  it('is true when the document has a variant', () => {
    const groups: DocumentVersionStatusGroup[] = [
      {items: [{version: published}]},
      {variantId: 'variant.german', items: [{version: draft}]},
    ]
    expect(hasMoreInInventory(groups, 0)).toBe(true)
  })

  it('is true when the flyout cut rows at its cap', () => {
    expect(hasMoreInInventory([{items: [{version: published}]}], 2)).toBe(true)
  })
})
