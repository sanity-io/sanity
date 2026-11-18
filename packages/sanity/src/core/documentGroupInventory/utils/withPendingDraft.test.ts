import {type DocumentSystem} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {type VariantSet} from '../machines/documentGroupInventoryMachine'
import {type Variant} from '../machines/selectionMachine'
import {type PendingDraft, withPendingDraft} from './withPendingDraft'

const GROUP_ID = 'book'

function version(id: string, variantId?: string, system: Partial<DocumentSystem> = {}): Variant {
  const document: VersionInfoDocumentStub = {
    _id: id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _type: 'book',
    _system: {
      group: {_ref: GROUP_ID, _weak: true},
      ...(variantId ? {variants: [{_ref: variantId, _key: variantId}]} : {}),
      ...system,
    },
  }
  return {id, name: variantId ?? 'Default', document}
}

const published: VariantSet = {
  key: 'published',
  name: 'Published',
  bundle: {type: 'perspective', perspective: 'published'},
  variants: [version(GROUP_ID), version('versions.p-de.book', 'variant.de-de')],
}
const drafts: VariantSet = {
  key: 'drafts',
  name: 'Draft',
  bundle: {type: 'perspective', perspective: 'drafts'},
  variants: [
    version('versions.d-at.book', 'variant.at', {bundleId: 'drafts'}),
    version('versions.d-germany.book', 'variant.germany', {bundleId: 'drafts'}),
  ],
}
const release: VariantSet = {
  key: 'rWinter',
  name: 'Winter sale',
  bundle: {type: 'perspective', perspective: 'drafts'},
  variants: [version('versions.rWinter.book')],
}

const deDraft: PendingDraft = {
  id: 'versions.d-de.book',
  variantId: 'variant.de-de',
  name: 'de-DE',
}

describe('withPendingDraft', () => {
  it('places a variant draft among the drafts in the inventory variant order', () => {
    const sets = withPendingDraft([published, drafts, release], deDraft, 'Draft')

    expect(sets.map(({key}) => key)).toEqual(['published', 'drafts', 'rWinter'])
    // variant.at < variant.de-de < variant.germany
    expect(sets[1].pending).toEqual({draft: deDraft, index: 1})
    // The ghost row is not one of the set's versions, so the set's count is unchanged
    expect(sets[1].variants).toHaveLength(2)
  })

  it('places a Default draft before the variants', () => {
    const sets = withPendingDraft(
      [published, drafts],
      {id: 'drafts.book', name: 'Default'},
      'Draft',
    )

    expect(sets[1].pending?.index).toBe(0)
  })

  it('places a variant draft last when it sorts after every draft', () => {
    const sets = withPendingDraft(
      [published, drafts],
      {id: 'versions.d-zz.book', variantId: 'variant.zz', name: 'ZZ'},
      'Draft',
    )

    expect(sets[1].pending?.index).toBe(2)
  })

  it('adds a Draft set after Published when the document has no drafts', () => {
    const sets = withPendingDraft([published, release], deDraft, 'Draft')

    expect(sets.map(({key}) => key)).toEqual(['published', 'drafts', 'rWinter'])
    expect(sets[1]).toMatchObject({
      name: 'Draft',
      bundle: {type: 'perspective', perspective: 'drafts'},
      variants: [],
      pending: {draft: deDraft, index: 0},
    })
  })

  it('leaves the sets alone once the draft exists', () => {
    const sets = [published, drafts]
    expect(withPendingDraft(sets, {...deDraft, id: 'versions.d-germany.book'}, 'Draft')).toBe(sets)
  })

  it('leaves the single set of a studio with Content Variants off alone', () => {
    const sets: VariantSet[] = [
      {key: 'studio:all', name: '2 versions', variants: published.variants},
    ]
    expect(withPendingDraft(sets, deDraft, 'Draft')).toBe(sets)
  })

  it('leaves the sets alone with no pending draft', () => {
    const sets = [published, drafts]
    expect(withPendingDraft(sets, undefined, 'Draft')).toBe(sets)
  })
})
