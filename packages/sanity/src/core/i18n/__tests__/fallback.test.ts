import {describe, expect, it} from 'vitest'

import {getFallbackLocaleSource} from '../fallback'

describe('getFallbackLocaleSource', () => {
  it('has the statically bundled core strings at once and the studio strings once loaded', async () => {
    const source = getFallbackLocaleSource()

    expect(source.t('validation:array.exact-length', {wantedLength: 2})).toBe(
      'Must have exactly 2 items',
    )

    // The studio namespace loads through the backend; `loadNamespaces` resolves once it is there.
    await source.loadNamespaces(['studio'])
    expect(source.t('studio:inputs.array.action.add-item')).toBe('Add item')
    expect(source.t('inputs.array.action.add-item')).toBe('Add item')
  })
})
