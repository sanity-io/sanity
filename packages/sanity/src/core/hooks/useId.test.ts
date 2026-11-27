import {describe, expect, it} from 'vitest'

import {useId as presentationUseId} from '../../presentation/useId'
import {toCssSafeId, useId} from './useId'

describe('useId', () => {
  it('is the helper the presentation tool already uses', () => {
    expect(presentationUseId).toBe(useId)
  })
})

describe('toCssSafeId', () => {
  it('rewrites the colon-wrapped useId form into a CSS ident', () => {
    expect(toCssSafeId(':r1:')).toBe('\u00ABr1\u00BB')
    expect(toCssSafeId(':R1a2:')).toBe('\u00ABR1a2\u00BB')
  })

  it('leaves an already safe id unchanged', () => {
    expect(toCssSafeId('_r_1_')).toBe('_r_1_')
    expect(toCssSafeId('\u00ABr1\u00BB')).toBe('\u00ABr1\u00BB')
  })
})
