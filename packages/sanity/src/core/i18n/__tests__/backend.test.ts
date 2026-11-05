import {describe, expect, test} from 'vitest'

import {createSanityI18nBackend} from '../backend'
import {type LocaleResourceBundle, type LocaleResourceRecord} from '../types'

function readResources(
  backend: ReturnType<typeof createSanityI18nBackend>,
  locale: string,
  namespace: string,
) {
  return new Promise<{error: unknown; data: unknown}>((resolve) => {
    backend.read?.(locale, namespace, (error, data) => {
      resolve({error, data})
    })
  })
}

function bundle(
  resources: LocaleResourceBundle['resources'],
  options: Partial<Pick<LocaleResourceBundle, 'deep' | 'overwrite' | 'locale' | 'namespace'>> = {},
): LocaleResourceBundle {
  return {
    locale: 'en-US',
    namespace: 'studio',
    resources,
    ...options,
  }
}

describe('createSanityI18nBackend', () => {
  test('reports a missing locale and namespace without asking i18next to retry', async () => {
    const {error, data} = await readResources(
      createSanityI18nBackend({bundles: []}),
      'nb-NO',
      'studio',
    )

    expect(error).toBe('No translations found for namespace "studio", language "nb-NO"')
    expect(data).toBeUndefined()
  })

  test('loads static resources for the requested locale and namespace', async () => {
    const {error, data} = await readResources(
      createSanityI18nBackend({
        bundles: [
          bundle({title: 'Studio'}),
          bundle({title: 'Vision'}, {namespace: 'vision'}),
          bundle({title: 'Studio NB'}, {locale: 'nb-NO'}),
        ],
      }),
      'en-US',
      'studio',
    )

    expect(error).toBeNull()
    expect(data).toEqual({title: 'Studio'})
  })

  test('loads lazy resources and unwraps a default ESM export', async () => {
    const {error, data} = await readResources(
      createSanityI18nBackend({
        bundles: [
          bundle(() => Promise.resolve({plain: 'ok'})),
          bundle(() => Promise.resolve({default: {wrapped: 'ok'}})),
        ],
      }),
      'en-US',
      'studio',
    )

    expect(error).toBeNull()
    expect(data).toEqual({plain: 'ok', wrapped: 'ok'})
  })

  test('asks i18next to retry when a lazy bundle rejects', async () => {
    const boom = new Error('bundle failed')
    const {error, data} = await readResources(
      createSanityI18nBackend({
        bundles: [bundle(() => Promise.reject(boom))],
      }),
      'en-US',
      'studio',
    )

    expect(error).toBe(boom)
    expect(data).toBe(true)
  })

  test('deep-merges later bundles and overwrites existing strings by default', async () => {
    const {error, data} = await readResources(
      createSanityI18nBackend({
        bundles: [
          bundle({
            buttons: {save: 'Save', cancel: 'Cancel'},
            title: 'Studio',
          }),
          bundle({
            buttons: {save: 'Lagre', publish: 'Publish'},
            title: 'Studio EN',
          }),
        ],
      }),
      'en-US',
      'studio',
    )

    expect(error).toBeNull()
    expect(data).toEqual({
      buttons: {save: 'Lagre', cancel: 'Cancel', publish: 'Publish'},
      title: 'Studio EN',
    })
  })

  test('keeps existing strings when overwrite is false and still adds missing keys', async () => {
    const {error, data} = await readResources(
      createSanityI18nBackend({
        bundles: [
          bundle({
            buttons: {save: 'Save'},
            title: 'Studio',
          }),
          bundle(
            {
              buttons: {save: 'Lagre', publish: 'Publish'},
              title: 'Studio EN',
            },
            {overwrite: false},
          ),
        ],
      }),
      'en-US',
      'studio',
    )

    expect(error).toBeNull()
    expect(data).toEqual({
      buttons: {save: 'Save', publish: 'Publish'},
      title: 'Studio',
    })
  })

  test('replaces a top-level object when deep is false and overwrite is true', async () => {
    const {error, data} = await readResources(
      createSanityI18nBackend({
        bundles: [
          bundle({
            buttons: {save: 'Save', cancel: 'Cancel'},
            title: 'Studio',
          }),
          bundle(
            {
              buttons: {publish: 'Publish'},
            },
            {deep: false},
          ),
        ],
      }),
      'en-US',
      'studio',
    )

    expect(error).toBeNull()
    expect(data).toEqual({
      buttons: {publish: 'Publish'},
      title: 'Studio',
    })
  })

  // SAPP-4852: Object.assign({}, resources, base) is discarded, so the later bundle is a no-op
  test.fails('adds missing keys from a shallow bundle when overwrite is false', async () => {
    const {error, data} = await readResources(
      createSanityI18nBackend({
        bundles: [
          bundle({title: 'Studio', buttons: {save: 'Save'}}),
          bundle(
            {title: 'Studio EN', subtitle: 'Workspace', buttons: {publish: 'Publish'}},
            {deep: false, overwrite: false},
          ),
        ],
      }),
      'en-US',
      'studio',
    )

    expect(error).toBeNull()
    expect(data).toEqual({
      title: 'Studio',
      subtitle: 'Workspace',
      buttons: {save: 'Save'},
    })
  })

  test('replaces an array when overwrite is true and leaves it when overwrite is false', async () => {
    const overwritten = await readResources(
      createSanityI18nBackend({
        bundles: [bundle({items: ['a']}), bundle({items: ['b', 'c']})],
      }),
      'en-US',
      'studio',
    )
    const kept = await readResources(
      createSanityI18nBackend({
        bundles: [bundle({items: ['a']}), bundle({items: ['b', 'c']}, {overwrite: false})],
      }),
      'en-US',
      'studio',
    )

    expect(overwritten.error).toBeNull()
    expect(overwritten.data).toEqual({items: ['b', 'c']})
    expect(kept.error).toBeNull()
    expect(kept.data).toEqual({items: ['a']})
  })

  test('overwrites a string leaf with a nested object and the reverse', async () => {
    const stringThenObject = await readResources(
      createSanityI18nBackend({
        bundles: [bundle({label: 'Save'}), bundle({label: {id: 'save'}})],
      }),
      'en-US',
      'studio',
    )
    const objectThenString = await readResources(
      createSanityI18nBackend({
        bundles: [bundle({label: {id: 'save'}}), bundle({label: 'Save'})],
      }),
      'en-US',
      'studio',
    )

    expect(stringThenObject.data).toEqual({label: {id: 'save'}})
    expect(objectThenString.data).toEqual({label: 'Save'})
  })

  test('does not copy __proto__ or constructor keys from a bundle', async () => {
    const resources: LocaleResourceRecord = {ok: 'kept'}
    Object.defineProperty(resources, '__proto__', {
      value: {polluted: 'yes'},
      enumerable: true,
      configurable: true,
    })
    Object.defineProperty(resources, 'constructor', {
      value: {name: 'nope'},
      enumerable: true,
      configurable: true,
    })

    const {error, data} = await readResources(
      createSanityI18nBackend({bundles: [bundle(resources)]}),
      'en-US',
      'studio',
    )

    expect(error).toBeNull()
    expect(data).toEqual({ok: 'kept'})
    expect(Object.hasOwn(data as object, '__proto__')).toBe(false)
    expect(Object.hasOwn(data as object, 'constructor')).toBe(false)
    expect(Object.prototype).not.toHaveProperty('polluted')
  })
})
