import {type Rule, type SchemaType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {getFallbackLocaleSource, normalizeValidationRules} from '../src/_internal'

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

// SAPP-4867: values Studio accepted and `sanity documents validate` rejected
const MALFORMED_HOST_URLS = [
  'https://link%20https<//cdn-www.pod-point.com/Complaints-and-Dispute-Resolution-Policy-PPSP-10-6.pdf?a=1>',
  'https://f%20you%20leave%20freephase%20dynamic,%20you%20won&apos;t%20be%20able%20to%20rejoin%20that%20tariff%20for%209%20months,%20even%20if%20you%20switch%20to%20another%20fixed%20or%20variable%20electricity%20tariff%20during%20that%20time./',
  'https://07480%20589%20950/',
  'https://a b.com/',
]

const VALID_URLS = [
  'https://www.sanity.io/docs?a=b#c',
  'https://b%C3%BCcher.de/',
  'https://bücher.de/',
  'https://exa%41mple.com/',
  'https://a*b.com/',
  'https://a_b.com/',
  'https://127.0.0.1:8080/',
  'http://[::1]:3333/',
  'http://localhost:3333/',
  'https://user%20name@example.com/ok',
  'https://example.com/a%20b?q=a%20b#a%20b',
  'mailto:hi@example.com',
  'mailto:hi%20there@example.com',
  'tel:+4712345678',
  'tel:07480%20589%20950',
]

const uriType = urlType((rule) => rule.uri({scheme: ['http', 'https', 'tel', 'mailto']}))

describe('uri() hostname validation (SAPP-4867)', () => {
  test.each(MALFORMED_HOST_URLS)('rejects malformed host: %s', async (url) => {
    const markers = await collectMarkers(uriType, url)
    expect(markers.map((marker) => marker.message)).toEqual(['Not a valid URL'])
  })

  test.each(VALID_URLS)('accepts %s', async (url) => {
    // credentials are allowed so the percent-encoded username case reaches the host check
    const markers = await collectMarkers(
      urlType((rule) =>
        rule.uri({scheme: ['http', 'https', 'tel', 'mailto'], allowCredentials: true}),
      ),
      url,
    )
    expect(markers).toEqual([])
  })

  test('accepts relative URLs when allowRelative is set', async () => {
    const type = urlType((rule) => rule.uri({allowRelative: true}))
    for (const url of ['/docs/a%20b', './a', '../a', '/']) {
      expect(await collectMarkers(type, url)).toEqual([])
    }
  })

  test('still rejects a malformed host when allowRelative is set', async () => {
    const type = urlType((rule) => rule.uri({allowRelative: true}))
    const markers = await collectMarkers(type, 'https://07480%20589%20950/')
    expect(markers.map((marker) => marker.message)).toEqual(['Not a valid URL'])
  })
})
