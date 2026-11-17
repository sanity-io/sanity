import {type VersionInfoDocumentStub} from 'sanity'
import {describe, expect, it} from 'vitest'

import {createVersion} from '../../__tests__/fixtures'
import {getDocumentVariantBundles} from '../getDocumentVariantBundles'

describe('getDocumentVariantBundles', () => {
  it('lists one bundle per version a variant has', () => {
    const {variantBundles} = getDocumentVariantBundles([
      createVersion({bundle: {release: 'rSummer'}, variant: 'foo'}),
      createVersion({bundle: 'drafts', variant: 'foo'}),
      createVersion({bundle: 'published', variant: 'bar'}),
    ])

    expect(variantBundles.get('_.variants.foo')).toEqual(['drafts', 'rSummer'])
    expect(variantBundles.get('_.variants.bar')).toEqual(['published'])
  })

  it('lists the versions outside any variant as Default, published and drafts first', () => {
    const {defaultBundles, variantBundles} = getDocumentVariantBundles([
      createVersion({bundle: {release: 'rSummer'}}),
      createVersion({bundle: {agent: 'agent-abc'}}),
      createVersion({bundle: 'drafts'}),
      createVersion({bundle: 'published'}),
      createVersion({bundle: 'published', variant: 'foo'}),
    ])

    expect(defaultBundles).toEqual(['published', 'drafts', 'rSummer', 'agent-abc'])
    expect([...variantBundles.keys()]).toEqual(['_.variants.foo'])
  })

  it('reads the deprecated single variant reference of unmigrated versions', () => {
    const version = createVersion({bundle: 'drafts'})
    const unmigrated: VersionInfoDocumentStub = {
      ...version,
      // oxlint-disable-next-line typescript/no-deprecated -- unmigrated documents still carry it
      _system: {...version._system, variant: {_ref: '_.variants.legacy'}},
    }

    const {defaultBundles, variantBundles} = getDocumentVariantBundles([unmigrated])

    expect(defaultBundles).toEqual([])
    expect(variantBundles.get('_.variants.legacy')).toEqual(['drafts'])
  })

  it('returns no bundles for a document with no versions', () => {
    expect(getDocumentVariantBundles([])).toEqual({defaultBundles: [], variantBundles: new Map()})
  })
})
