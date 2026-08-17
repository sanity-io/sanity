import {describe, expect, it} from 'vitest'

import {getPairTargetScopeId, normalizeDocumentPairTarget} from './normalizeDocumentPairTarget'
import {type DocumentPairTarget} from './types'

describe('normalizeDocumentPairTarget', () => {
  it('normalizes a bare string to a plain version target keyed by scope id', () => {
    expect(normalizeDocumentPairTarget('rSummer')).toEqual({kind: 'version', scopeId: 'rSummer'})
  })

  it('returns undefined for the base draft/published pair', () => {
    expect(normalizeDocumentPairTarget(undefined)).toBeUndefined()
  })

  it('passes target objects through by reference', () => {
    const targets: DocumentPairTarget[] = [
      {kind: 'version', scopeId: 'rSummer'},
      {kind: 'variant', scopeId: 'varscope', variantId: '_.variants.french'},
      {kind: 'target-missing', variantId: '_.variants.french'},
      {kind: 'target-missing'},
      {kind: 'unresolved'},
    ]

    for (const target of targets) {
      expect(normalizeDocumentPairTarget(target)).toBe(target)
    }
  })
})

describe('getPairTargetScopeId', () => {
  it('returns the scope id for resolvable targets (version and variant)', () => {
    expect(getPairTargetScopeId({kind: 'version', scopeId: 'rSummer'})).toBe('rSummer')
    expect(
      getPairTargetScopeId({kind: 'variant', scopeId: 'varscope', variantId: '_.variants.french'}),
    ).toBe('varscope')
  })

  it('returns undefined for the base pair and the guarded kinds', () => {
    // Guarded kinds never reach pair checkout: the store emits disabled operations instead.
    expect(getPairTargetScopeId(undefined)).toBeUndefined()
    expect(getPairTargetScopeId({kind: 'target-missing'})).toBeUndefined()
    expect(
      getPairTargetScopeId({kind: 'target-missing', variantId: '_.variants.french'}),
    ).toBeUndefined()
    expect(getPairTargetScopeId({kind: 'unresolved'})).toBeUndefined()
  })
})
