import {type Rule, type SchemaType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {getFallbackLocaleSource} from '../../src/core/i18n/fallback'
import {normalizeValidationRules} from '../../src/core/validation/util/normalizeValidationRules'

const context: any = {client: {}, i18n: getFallbackLocaleSource()}

const DISALLOWED_SCHEME_MESSAGE = 'Does not match allowed protocols/schemes'

const urlType = (validation: SchemaType['validation']): SchemaType =>
  ({name: 'url', jsonType: 'string', validation}) as SchemaType

async function collectMarkers(typeDef: SchemaType, value: unknown) {
  const rules = normalizeValidationRules(typeDef, context)
  const markers = await Promise.all(rules.map((rule) => rule.validate(value, context)))
  return markers.flat()
}

describe('url validation scheme override (SAPP-4059 / GH #3298)', () => {
  test('single rule respects custom scheme', async () => {
    const markers = await collectMarkers(
      urlType((rule) => rule.uri({scheme: ['mailto', 'tel', 'http', 'https']})),
      'mailto:hi@example.com',
    )

    expect(markers.map((marker) => marker.message)).not.toContain(DISALLOWED_SCHEME_MESSAGE)
  })

  test('array rule respects custom scheme on a sibling element', async () => {
    const markers = await collectMarkers(
      urlType((rule) => [
        rule.uri({scheme: ['mailto', 'tel', 'http', 'https']}),
        rule.custom(() => true),
      ]),
      'mailto:hi@example.com',
    )

    expect(markers.map((marker) => marker.message)).not.toContain(DISALLOWED_SCHEME_MESSAGE)
  })

  test('array rule preserves independent levels while respecting the custom scheme', async () => {
    const markers = await collectMarkers(
      urlType((rule) => [
        rule.uri({scheme: ['mailto']}),
        rule.custom<string>(() => 'always warn').warning(),
      ]),
      'mailto:hi@example.com',
    )

    expect(markers.map((marker) => marker.message)).not.toContain(DISALLOWED_SCHEME_MESSAGE)
    expect(markers).toEqual([expect.objectContaining({level: 'warning', message: 'always warn'})])
  })

  test('array rule keeps the default scheme when no element overrides it', async () => {
    const markers = await collectMarkers(
      urlType((rule) => [rule.required(), rule.custom(() => true)]),
      'ftp://example.com',
    )

    expect(markers.map((marker) => marker.message)).toContain(DISALLOWED_SCHEME_MESSAGE)
  })

  test('non-url string array is unaffected', async () => {
    const stringType = {
      name: 'coolString',
      jsonType: 'string',
      validation: (rule: Rule) => [rule.min(2), rule.custom(() => true)],
    } as SchemaType

    const markers = await collectMarkers(stringType, 'a')
    expect(markers).toHaveLength(1)
    expect(markers[0].message).not.toBe(DISALLOWED_SCHEME_MESSAGE)
  })
})
