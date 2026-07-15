import {renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {type DocumentPairTarget} from '../../store/document/types'
import {useMemoizedDocumentPairTarget} from '../useMemoizedDocumentPairTarget'

function renderTarget(initialVersion: string | DocumentPairTarget | undefined) {
  return renderHook(({version}) => useMemoizedDocumentPairTarget(version), {
    initialProps: {version: initialVersion},
  })
}

describe('useMemoizedDocumentPairTarget', () => {
  it('returns undefined for the base draft/published pair', () => {
    const {result} = renderTarget(undefined)
    expect(result.current).toBeUndefined()
  })

  it('normalizes a bare string to a plain version target keyed by scope id', () => {
    const {result} = renderTarget('rSummer')
    expect(result.current).toEqual({kind: 'version', scopeId: 'rSummer'})
  })

  it('returns every target kind by value, preserving the exact shape', () => {
    const targets: DocumentPairTarget[] = [
      {kind: 'version', scopeId: 'rSummer'},
      {kind: 'variant', scopeId: 'varscope', variantId: '_.variants.french'},
      {kind: 'target-missing', variantId: '_.variants.french'},
      {kind: 'target-missing'},
      {kind: 'unresolved'},
    ]

    for (const target of targets) {
      const {result} = renderTarget(target)
      // Strict equality: no `variantId: undefined` key may appear when none was given.
      expect(result.current).toStrictEqual(target)
    }
  })

  it('keeps the same reference when a fresh but equal target is passed on re-render', () => {
    const {result, rerender} = renderTarget({
      kind: 'variant',
      scopeId: 'varscope',
      variantId: '_.variants.french',
    })
    const first = result.current

    // A new object with the same contents — the typical inline `getPairTarget(...)` caller.
    rerender({version: {kind: 'variant', scopeId: 'varscope', variantId: '_.variants.french'}})

    expect(result.current).toBe(first)
  })

  it('keeps the same reference when a bare string is re-passed', () => {
    const {result, rerender} = renderTarget('rSummer')
    const first = result.current

    rerender({version: 'rSummer'})

    expect(result.current).toBe(first)
  })

  it('returns a new value when the target contents change', () => {
    const {result, rerender} = renderTarget({
      kind: 'variant',
      scopeId: 'varscope',
      variantId: '_.variants.french',
    })
    const first = result.current

    rerender({version: {kind: 'variant', scopeId: 'otherscope', variantId: '_.variants.french'}})

    expect(result.current).not.toBe(first)
    expect(result.current).toEqual({
      kind: 'variant',
      scopeId: 'otherscope',
      variantId: '_.variants.french',
    })
  })

  it('transitions between kinds, including back to the base pair', () => {
    const {result, rerender} = renderTarget({kind: 'unresolved'})
    expect(result.current).toEqual({kind: 'unresolved'})

    rerender({version: {kind: 'target-missing', variantId: '_.variants.french'}})
    expect(result.current).toEqual({kind: 'target-missing', variantId: '_.variants.french'})

    rerender({version: undefined})
    expect(result.current).toBeUndefined()
  })
})
