import {describe, expect, it} from 'vitest'

import {studioDefaultLocaleResources} from '../bundles/studio'
import {validationLocaleResources} from '../bundles/validation'
import {getFallbackLocaleSource} from '../fallback'
import {isStaticResourceBundle} from '../helpers'

describe('isStaticResourceBundle', () => {
  it('treats a resources loader function as lazy, like a promise', () => {
    expect(isStaticResourceBundle(validationLocaleResources)).toBe(true)
    expect(isStaticResourceBundle(studioDefaultLocaleResources)).toBe(false)
    expect(isStaticResourceBundle({namespace: 'x', resources: Promise.resolve({}) as never})).toBe(
      false,
    )
  })
})

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
