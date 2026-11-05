import {describe, expect, it} from 'vitest'

import {createVersion} from '../../__tests__/fixtures'
import {getNavigationBadges} from '../getNavigationBadges'

const versions = [
  createVersion({bundle: 'published'}),
  createVersion({bundle: 'drafts'}),
  createVersion({bundle: {release: 'rA'}}),
  createVersion({bundle: {release: 'rC'}}),
  createVersion({bundle: 'published', variant: 'variantA'}),
  createVersion({bundle: {release: 'rA'}, variant: 'variantA'}),
  createVersion({bundle: {release: 'rB'}, variant: 'variantA'}),
  createVersion({bundle: {release: 'rB'}, variant: 'variantB'}),
]

describe('getNavigationBadges', () => {
  it('shows the bundles outside any variant for Default', () => {
    expect(getNavigationBadges({versions, variantId: undefined})).toEqual({
      hasPublished: true,
      hasDraft: true,
      releaseIds: ['rA', 'rC'],
      agentBundleIds: [],
    })
  })

  it('shows only the bundles of the selected variant', () => {
    expect(getNavigationBadges({versions, variantId: '_.variants.variantA'})).toEqual({
      hasPublished: true,
      hasDraft: false,
      releaseIds: ['rA', 'rB'],
      agentBundleIds: [],
    })
  })

  it('reports a variant with no published or draft version', () => {
    expect(getNavigationBadges({versions, variantId: '_.variants.variantB'})).toEqual({
      hasPublished: false,
      hasDraft: false,
      releaseIds: ['rB'],
      agentBundleIds: [],
    })
  })

  it('returns nothing for a variant the document is not in', () => {
    expect(getNavigationBadges({versions, variantId: '_.variants.other'})).toEqual({
      hasPublished: false,
      hasDraft: false,
      releaseIds: [],
      agentBundleIds: [],
    })
  })

  it('lists agent bundles only in the variant they belong to', () => {
    const withAgents = [
      ...versions,
      createVersion({bundle: {agent: 'agent-mine'}}),
      createVersion({bundle: {agent: 'agent-variant'}, variant: 'variantA'}),
    ]

    expect(
      getNavigationBadges({versions: withAgents, variantId: undefined}).agentBundleIds,
    ).toEqual(['agent-mine'])
    expect(
      getNavigationBadges({versions: withAgents, variantId: '_.variants.variantA'}).agentBundleIds,
    ).toEqual(['agent-variant'])
  })
})
