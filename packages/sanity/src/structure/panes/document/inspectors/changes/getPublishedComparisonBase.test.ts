import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {
  getPublishedComparisonBase,
  getPublishedSiblingScopeId,
  type PublishedComparisonSiblings,
} from './getPublishedComparisonBase'

const publishedDoc: SanityDocument = {
  _id: 'article-1',
  _type: 'article',
  _rev: 'pub-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-02T00:00:00Z',
  title: 'Base published',
}

const variantPublishedDoc: SanityDocument = {
  _id: 'versions.varscopePub.article-1',
  _type: 'article',
  _rev: 'var-pub-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-03T00:00:00Z',
  title: 'Variant published',
}

const baseSiblings: PublishedComparisonSiblings = {
  published: {_system: {}},
}

const variantSiblings: PublishedComparisonSiblings = {
  published: {_system: {scopeId: 'varscopePub'}},
}

const unpublishedSiblings: PublishedComparisonSiblings = {
  published: undefined,
}

describe('getPublishedSiblingScopeId', () => {
  it('returns the published sibling scope id when present', () => {
    expect(getPublishedSiblingScopeId(variantSiblings)).toBe('varscopePub')
  })

  it('returns undefined for the base pair and while siblings are resolving', () => {
    expect(getPublishedSiblingScopeId(baseSiblings)).toBeUndefined()
    expect(getPublishedSiblingScopeId(undefined)).toBeUndefined()
    expect(getPublishedSiblingScopeId(unpublishedSiblings)).toBeUndefined()
  })
})

describe('getPublishedComparisonBase', () => {
  it('uses editState.published for the base pair when a published sibling exists', () => {
    expect(
      getPublishedComparisonBase({
        siblings: baseSiblings,
        siblingVersion: variantPublishedDoc,
        published: publishedDoc,
      }),
    ).toBe(publishedDoc)
  })

  it('falls back to editState.published while siblings are still resolving', () => {
    expect(
      getPublishedComparisonBase({
        siblings: undefined,
        siblingVersion: undefined,
        published: publishedDoc,
      }),
    ).toBe(publishedDoc)
  })

  it('returns null when the lane has no published sibling', () => {
    expect(
      getPublishedComparisonBase({
        siblings: unpublishedSiblings,
        siblingVersion: variantPublishedDoc,
        published: publishedDoc,
      }),
    ).toBeNull()
  })

  it('uses the sibling version document for a scoped published variant', () => {
    // Covers both a ready variant target and variant-missing (siblings.published is
    // still the variant-of-published stub). Must not use the group's published document.
    expect(
      getPublishedComparisonBase({
        siblings: variantSiblings,
        siblingVersion: variantPublishedDoc,
        published: publishedDoc,
      }),
    ).toBe(variantPublishedDoc)
  })

  it('does not fall back to the group published document for a scoped variant', () => {
    expect(
      getPublishedComparisonBase({
        siblings: variantSiblings,
        siblingVersion: null,
        published: publishedDoc,
      }),
    ).toBeNull()
  })

  it('returns null while the scoped published sibling pair is still loading', () => {
    expect(
      getPublishedComparisonBase({
        siblings: variantSiblings,
        siblingVersion: undefined,
        published: publishedDoc,
      }),
    ).toBeNull()
  })

  it('returns null when resolving and the default published document has not loaded', () => {
    expect(
      getPublishedComparisonBase({
        siblings: undefined,
        siblingVersion: undefined,
        published: null,
      }),
    ).toBeNull()
  })
})
