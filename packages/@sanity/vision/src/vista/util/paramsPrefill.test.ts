import {type TFunction} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {type visionLocaleNamespace} from '../../i18n'
import {addMissingParams, missingParamNames} from './paramsPrefill'

// `missingParamNames` pulls in `parseParams` from the (React) ParamsEditor module, which
// value-imports `useTranslation` from 'sanity' at module scope. Mocked for the same reason every
// other @sanity/vision unit test mocks 'sanity': the real package index is heavy, and this test
// never calls useTranslation itself. `missingParamNames` is only ever handed a `t` it was given.
vi.mock('sanity', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  useTranslation: () => ({t: (key: string) => key}),
}))

// parseParams only calls `t` to build the message for invalid JSON5, which none of these
// assertions read; a stub that echoes the key back is enough to drive `missingParamNames`.
const t = ((key: string) => key) as TFunction<typeof visionLocaleNamespace>

describe('addMissingParams', () => {
  it('leaves rawParams unchanged when there is nothing missing', () => {
    expect(addMissingParams('{\n  "a": 1\n}', [])).toBe('{\n  "a": 1\n}')
  })

  it('fills in an empty object', () => {
    expect(addMissingParams('{}', ['foo'])).toBe('{\n  "foo": "",\n}')
  })

  it('fills in blank or whitespace-only input as if it were an empty object', () => {
    expect(addMissingParams('', ['foo'])).toBe('{\n  "foo": "",\n}')
    expect(addMissingParams('  \n  ', ['foo'])).toBe('{\n  "foo": "",\n}')
  })

  it('appends after existing keys, adding a comma', () => {
    expect(addMissingParams('{\n  "a": 1\n}', ['foo'])).toBe('{\n  "a": 1\n,\n  "foo": "",\n}')
  })

  it('does not add a comma when the existing content already ends with one', () => {
    expect(addMissingParams('{\n  "a": 1,\n}', ['foo'])).toBe('{\n  "a": 1,\n  "foo": "",\n}')
  })

  it('adds multiple missing names in one pass', () => {
    expect(addMissingParams('{\n  "a": 1\n}', ['foo', 'bar'])).toBe(
      '{\n  "a": 1\n,\n  "foo": "",\n  "bar": "",\n}',
    )
  })

  it('never rewrites a trailing line comment on the last existing key', () => {
    const rawParams = '{\n  "a": 1 // kept as-is, on purpose\n}'
    const result = addMissingParams(rawParams, ['foo'])

    expect(result).toBe('{\n  "a": 1 // kept as-is, on purpose\n,\n  "foo": "",\n}')
    expect(result).toContain('// kept as-is, on purpose\n')
  })

  it('preserves single-quoted and unquoted JSON5 keys untouched', () => {
    const rawParams = "{\n  foo: 'bar',\n}"
    expect(addMissingParams(rawParams, ['baz'])).toBe('{\n  foo: \'bar\',\n  "baz": "",\n}')
  })

  it('leaves rawParams unchanged when its root is not a {...} object', () => {
    expect(addMissingParams('[1, 2]', ['foo'])).toBe('[1, 2]')
    expect(addMissingParams('not json at all', ['foo'])).toBe('not json at all')
  })
})

describe('missingParamNames', () => {
  it('returns referenced names that have no key yet', () => {
    expect(missingParamNames(['foo', 'bar'], '{\n  "foo": 1\n}', t)).toEqual(['bar'])
  })

  it('returns an empty array when every referenced name already has a key', () => {
    expect(missingParamNames(['foo'], '{\n  "foo": 1\n}', t)).toEqual([])
  })

  it('treats blank rawParams as having no keys', () => {
    expect(missingParamNames(['foo', 'bar'], '', t)).toEqual(['foo', 'bar'])
  })

  it('returns undefined when rawParams is not valid JSON5', () => {
    expect(missingParamNames(['foo'], '{not valid', t)).toBeUndefined()
  })
})
