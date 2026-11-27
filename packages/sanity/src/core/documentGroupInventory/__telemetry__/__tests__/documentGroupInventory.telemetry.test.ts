import {type DocumentSystem} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {getInventoryVersionTelemetry} from '../documentGroupInventory.telemetry'

function version(_id: string, system: Omit<DocumentSystem, 'group'>): VersionInfoDocumentStub {
  return {
    _id,
    _type: 'article',
    _rev: 'rev',
    _createdAt: '2025-01-01T00:00:00Z',
    _updatedAt: '2025-01-01T00:00:00Z',
    _system: {group: {_ref: 'article-1', _weak: true}, ...system},
  }
}

const inVariant = {variants: [{_ref: '_.variants.alpha', _key: 'variant'}]}

describe('getInventoryVersionTelemetry', () => {
  it.each([
    ['the published document', version('article-1', {}), 'published', false],
    ['the draft', version('drafts.article-1', {bundleId: 'drafts'}), 'drafts', false],
    [
      'a release version',
      version('versions.rSummer.article-1', {
        bundleId: 'rSummer',
        release: {_ref: '_.releases.rSummer', _weak: true},
      }),
      'release',
      false,
    ],
    [
      'an agent bundle version',
      version('versions.agent-abc.article-1', {bundleId: 'agent-abc'}),
      'agent',
      false,
    ],
    [
      'the variant of the published document',
      version('versions.scope-published.article-1', inVariant),
      'published',
      true,
    ],
    [
      'a variant draft, whose id says nothing about its bundle',
      version('versions.scope-draft.article-1', {...inVariant, bundleId: 'drafts'}),
      'drafts',
      true,
    ],
  ] as const)('classifies %s', (_, document, bundle, isVariant) => {
    expect(getInventoryVersionTelemetry(document)).toEqual({bundle, isVariant})
  })
})
