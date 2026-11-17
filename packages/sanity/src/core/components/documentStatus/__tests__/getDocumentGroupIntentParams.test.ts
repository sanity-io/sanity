import {describe, expect, it} from 'vitest'

import {activeASAPRelease, scheduledRelease} from '../../../releases/__fixtures__/release.fixture'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {getDocumentGroupIntentParams} from '../getDocumentGroupIntentParams'

const ID = 'article-1'
const GERMAN = '_.variants.german'

function version(id: string, bundleId?: string, variant?: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'article',
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-10-22T11:00:00.000Z',
    _system: {
      bundleId,
      group: {_ref: ID, _weak: true},
      ...(variant ? {variants: [{_ref: variant, _weak: true}]} : {}),
    },
  } as VersionInfoDocumentStub
}

const INVENTORY = {id: ID, type: 'article', inspect: 'sanity/structure/document-group'}

describe('getDocumentGroupIntentParams', () => {
  it('opens the document with the document group inventory', () => {
    expect(getDocumentGroupIntentParams({id: ID, type: 'article'})).toEqual(INVENTORY)
  })

  it('asks to create the picked variant when it has no version in the release in view', () => {
    expect(
      getDocumentGroupIntentParams({
        id: ID,
        type: 'article',
        variantId: GERMAN,
        selectedPerspective: activeASAPRelease,
        versions: [version(`drafts.${ID}`, 'drafts')],
      }),
    ).toEqual({...INVENTORY, createVariant: GERMAN})
  })

  it('does not when the variant already has a version in that release', () => {
    expect(
      getDocumentGroupIntentParams({
        id: ID,
        type: 'article',
        variantId: GERMAN,
        selectedPerspective: activeASAPRelease,
        versions: [version(`versions.rASAP.${ID}`, 'rASAP', GERMAN)],
      }),
    ).toEqual(INVENTORY)
  })

  it('does not for the Default audience, outside a release, or in a scheduled release', () => {
    const base = {id: ID, type: 'article', versions: []}
    expect(
      getDocumentGroupIntentParams({
        ...base,
        variantId: null,
        selectedPerspective: activeASAPRelease,
      }),
    ).toEqual(INVENTORY)
    expect(
      getDocumentGroupIntentParams({...base, variantId: GERMAN, selectedPerspective: 'drafts'}),
    ).toEqual(INVENTORY)
    expect(
      getDocumentGroupIntentParams({
        ...base,
        variantId: GERMAN,
        selectedPerspective: scheduledRelease,
      }),
    ).toEqual(INVENTORY)
  })
})
