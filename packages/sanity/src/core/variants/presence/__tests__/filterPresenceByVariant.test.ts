import {type DocumentSystem, type User} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {type DocumentPresence} from '../../../store/presence/types'
import {filterPresenceByVariant, getVariantScopeIds} from '../filterPresenceByVariant'

const GROUP_ID = 'article-1'
const VARIANT_ALPHA = '_.variants.alpha'
const VARIANT_BETA = '_.variants.beta'

const user = {id: 'user-1', displayName: 'Ola'} as User

function stub(system: Partial<DocumentSystem> & {scopeId?: string}): VersionInfoDocumentStub {
  const {scopeId} = system
  return {
    _id: scopeId ? `versions.${scopeId}.${GROUP_ID}` : GROUP_ID,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    _system: {
      group: {_ref: GROUP_ID, _weak: true},
      ...system,
    } as DocumentSystem,
  }
}

function presenceAt(documentId: string): DocumentPresence {
  return {
    user,
    path: [],
    sessionId: `session-${documentId}`,
    documentId,
    lastActiveAt: '2026-01-01T00:00:00Z',
  }
}

// A group with: the base published + draft documents, a release version, and two variants that
// each exist in the published and drafts bundles.
const documentVersions: VersionInfoDocumentStub[] = [
  stub({}),
  stub({bundleId: 'drafts', scopeId: 'drafts'}),
  stub({bundleId: 'rSummer', scopeId: 'rSummer'}),
  stub({variant: {_ref: VARIANT_ALPHA, _weak: true}, scopeId: 'alphaPub'}),
  stub({variant: {_ref: VARIANT_ALPHA, _weak: true}, bundleId: 'drafts', scopeId: 'alphaDraft'}),
  stub({variant: {_ref: VARIANT_BETA, _weak: true}, scopeId: 'betaPub'}),
  stub({variant: {_ref: VARIANT_BETA, _weak: true}, bundleId: 'drafts', scopeId: 'betaDraft'}),
]

describe('getVariantScopeIds', () => {
  it('maps the scope id of every variant document to its variant', () => {
    expect(getVariantScopeIds(documentVersions)).toEqual(
      new Map([
        ['alphaPub', VARIANT_ALPHA],
        ['alphaDraft', VARIANT_ALPHA],
        ['betaPub', VARIANT_BETA],
        ['betaDraft', VARIANT_BETA],
      ]),
    )
  })

  it('leaves the base and release documents unattributed', () => {
    const scopeIds = getVariantScopeIds(documentVersions)
    expect(scopeIds.has('drafts')).toBe(false)
    expect(scopeIds.has('rSummer')).toBe(false)
  })

  it('attributes the advertised draft sibling of a published variant', () => {
    // The draft variant doesn't exist yet, but the published variant advertises the id it will
    // occupy — an editor creating it reports presence there before the document exists.
    const scopeIds = getVariantScopeIds([
      stub({
        variant: {_ref: VARIANT_ALPHA, _weak: true},
        scopeId: 'alphaPub',
        draft: {_ref: `versions.alphaDraft.${GROUP_ID}`, _weak: true},
      }),
    ])

    expect(scopeIds.get('alphaDraft')).toBe(VARIANT_ALPHA)
  })

  it('falls back to the id when a variant stub carries no scope id', () => {
    const scopeIds = getVariantScopeIds([
      {
        ...stub({variant: {_ref: VARIANT_ALPHA, _weak: true}}),
        _id: `versions.alphaPub.${GROUP_ID}`,
      },
    ])

    expect(scopeIds.get('alphaPub')).toBe(VARIANT_ALPHA)
  })
})

describe('filterPresenceByVariant', () => {
  const variantScopeIds = getVariantScopeIds(documentVersions)

  const presence = [
    presenceAt(GROUP_ID),
    presenceAt(`drafts.${GROUP_ID}`),
    presenceAt(`versions.rSummer.${GROUP_ID}`),
    presenceAt(`versions.alphaPub.${GROUP_ID}`),
    presenceAt(`versions.alphaDraft.${GROUP_ID}`),
    presenceAt(`versions.betaDraft.${GROUP_ID}`),
  ]

  it('shows only editors of the selected variant', () => {
    const result = filterPresenceByVariant({
      presence,
      selectedVariantId: VARIANT_ALPHA,
      variantScopeIds,
    })

    expect(result.map((item) => item.documentId)).toEqual([
      `versions.alphaPub.${GROUP_ID}`,
      `versions.alphaDraft.${GROUP_ID}`,
    ])
  })

  it('keeps editors of different variants apart', () => {
    const alpha = filterPresenceByVariant({
      presence,
      selectedVariantId: VARIANT_ALPHA,
      variantScopeIds,
    })
    const beta = filterPresenceByVariant({
      presence,
      selectedVariantId: VARIANT_BETA,
      variantScopeIds,
    })

    expect(alpha).not.toEqual(expect.arrayContaining(beta))
    expect(beta.map((item) => item.documentId)).toEqual([`versions.betaDraft.${GROUP_ID}`])
  })

  it('hides variant editors from the base document, keeping draft, published and releases', () => {
    const result = filterPresenceByVariant({
      presence,
      selectedVariantId: undefined,
      variantScopeIds,
    })

    expect(result.map((item) => item.documentId)).toEqual([
      GROUP_ID,
      `drafts.${GROUP_ID}`,
      `versions.rSummer.${GROUP_ID}`,
    ])
  })

  it('returns the presence array unchanged when the group has no variants', () => {
    const result = filterPresenceByVariant({
      presence,
      selectedVariantId: undefined,
      variantScopeIds: new Map(),
    })

    expect(result).toBe(presence)
  })

  it('treats presence without a document id as base presence', () => {
    const anonymous = {...presenceAt(GROUP_ID), documentId: undefined}

    expect(
      filterPresenceByVariant({
        presence: [anonymous],
        selectedVariantId: undefined,
        variantScopeIds,
      }),
    ).toEqual([anonymous])

    expect(
      filterPresenceByVariant({
        presence: [anonymous],
        selectedVariantId: VARIANT_ALPHA,
        variantScopeIds,
      }),
    ).toEqual([])
  })
})
