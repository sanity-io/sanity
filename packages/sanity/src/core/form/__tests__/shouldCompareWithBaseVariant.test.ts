import {describe, expect, it} from 'vitest'

import {type TargetDocumentState} from '../../hooks/useTargetDocumentState'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {variantAlphaAudience} from '../../variants/__fixtures__/variants.fixture'
import {shouldCompareWithBaseVariant} from '../shouldCompareWithBaseVariant'

const PUBLISHED_ID = 'article-1'

const publishedVariant: VersionInfoDocumentStub = {
  _id: `versions.varscopePub.${PUBLISHED_ID}`,
  _rev: 'rev-pub',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-02T00:00:00Z',
  _type: 'article',
  _system: {
    group: {_ref: PUBLISHED_ID, _weak: true},
    variants: [{_ref: variantAlphaAudience._id, _key: 'k-1'}],
    scopeId: 'varscopePub',
    draft: {_ref: `versions.varscopeDraft.${PUBLISHED_ID}`, _weak: true},
  },
}

const siblings = {published: publishedVariant, draft: undefined, version: undefined}

const readyVariant: TargetDocumentState = {
  status: 'ready',
  targetDocument: publishedVariant,
  scopeId: 'varscopePub',
  variant: variantAlphaAudience,
  siblings,
}

const creatableVariant: TargetDocumentState = {
  status: 'variant-missing',
  variant: variantAlphaAudience,
  bundle: 'drafts',
  siblings,
  creatableTarget: {id: `versions.varscopeDraft.${PUBLISHED_ID}`, scopeId: 'varscopeDraft'},
}

describe('shouldCompareWithBaseVariant', () => {
  it('compares a resolved variant version', () => {
    expect(shouldCompareWithBaseVariant(readyVariant, false)).toBe(true)
  })

  it('compares a published variant viewed in Drafts before its draft exists', () => {
    expect(shouldCompareWithBaseVariant(creatableVariant, false)).toBe(true)
  })

  it('does not compare the Default document', () => {
    expect(
      shouldCompareWithBaseVariant(
        {
          status: 'ready',
          targetDocument: undefined,
          scopeId: undefined,
          variant: undefined,
          siblings,
        },
        false,
      ),
    ).toBe(false)
  })

  it('does not compare a variant with no version to show', () => {
    const {creatableTarget: _creatableTarget, ...missing} = creatableVariant as Extract<
      TargetDocumentState,
      {status: 'variant-missing'}
    >
    expect(shouldCompareWithBaseVariant(missing, false)).toBe(false)
  })

  it('does not compare while the target is resolving', () => {
    expect(shouldCompareWithBaseVariant({status: 'resolving'}, false)).toBe(false)
  })

  it('does not compare a historical revision', () => {
    expect(shouldCompareWithBaseVariant(readyVariant, true)).toBe(false)
    expect(shouldCompareWithBaseVariant(creatableVariant, true)).toBe(false)
  })
})
