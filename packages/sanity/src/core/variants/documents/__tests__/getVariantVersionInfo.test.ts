import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {getVariantVersionInfo} from '../getVariantVersionInfo'

function doc(system: SanityDocument['_system']): SanityDocument {
  return {
    _id: 'versions.varscope.article-1',
    _type: 'article',
    _rev: 'r1',
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
    _system: system,
  }
}

const groupRef = {_ref: 'article-1', _weak: true as const}
const variantRef = {_ref: '_.variants.french', _weak: true as const}

describe('getVariantVersionInfo', () => {
  it('derives variantId and drafts bundle for a variant-over-drafts document', () => {
    expect(
      getVariantVersionInfo(
        doc({bundleId: 'drafts', variant: variantRef, group: groupRef, scopeId: 'varscope'}),
      ),
    ).toEqual({variantId: 'french', bundleId: 'drafts'})
  })

  it('reports the published bundle for a variant-of-published document (no bundleId)', () => {
    expect(
      getVariantVersionInfo(doc({variant: variantRef, group: groupRef, scopeId: 'varscope'})),
    ).toEqual({variantId: 'french', bundleId: 'published'})
  })

  it('reports the release bundle for a release-scoped variant document', () => {
    expect(
      getVariantVersionInfo(
        doc({
          bundleId: 'rSummer',
          variant: variantRef,
          release: {_ref: '_.releases.rSummer', _weak: true},
          group: groupRef,
          scopeId: 'varscope',
        }),
      ),
    ).toEqual({variantId: 'french', bundleId: 'rSummer'})
  })

  it('returns undefined for non-variant versions (release/draft/published)', () => {
    expect(
      getVariantVersionInfo(
        doc({
          bundleId: 'rSummer',
          release: {_ref: '_.releases.rSummer', _weak: true},
          group: groupRef,
          scopeId: 'rSummer',
        }),
      ),
    ).toBeUndefined()
    expect(getVariantVersionInfo(doc({bundleId: 'drafts', group: groupRef}))).toBeUndefined()
    expect(getVariantVersionInfo(doc(undefined))).toBeUndefined()
  })

  it('returns undefined for null or missing documents', () => {
    expect(getVariantVersionInfo(null)).toBeUndefined()
    expect(getVariantVersionInfo(undefined)).toBeUndefined()
  })
})
