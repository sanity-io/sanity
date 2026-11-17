import {configure} from '@chromatic-com/vitest'
import {getFallbackLocaleSource, Rule} from '@sanity/validation/_internal'
import {describe, expect, test} from 'vitest'

// Chromium accepts special-scheme hosts that still contain `%20` after parsing, where Node,
// Firefox and WebKit throw, so only the Chromium run reaches the hostname check. The other
// browsers still lock the shared result. No UI, so skip the Chromatic archive.
configure({disableAutoSnapshot: true, resourceArchiveTimeout: 0})

const context: any = {client: {}, i18n: getFallbackLocaleSource()}

const invalidUrl = [
  expect.objectContaining({
    code: 'string.url.invalid',
    level: 'error',
    message: 'Not a valid URL',
  }),
]

describe('uri() hosts that percent-decode to forbidden domain code points (SAPP-4867)', () => {
  test('rejects them in special-scheme URLs', async () => {
    const rule = Rule.string().uri()
    const rejected = [
      'https://07480%20589%20950/',
      'https://f%20you%20leave%20freephase%20dynamic,%20you%20won%27t%20be%20able%20to%20rejoin/',
      'https://link%20https://cdn-www.pod-point.com/policy.pdf',
      'https://link%20https<//cdn-www.pod-point.com/policy.pdf?a=1>',
      'https://a%3Cb.com/',
      'https://exa mple.com/',
      'ftp://07480%20589%20950/file',
      'ws://07480%20589%20950/socket',
      'https://example.com%20/',
    ]

    await Promise.all(
      rejected.map((value) =>
        expect(rule.validate(value, context), value).resolves.toEqual(invalidUrl),
      ),
    )

    await expect(rule.validate('ws://example.com/socket', context)).resolves.toEqual([
      expect.objectContaining({
        code: 'string.url.scheme-not-allowed',
        message: 'Does not match allowed protocols/schemes',
      }),
    ])
  })

  test('allows percent-encoding outside the hostname, valid hosts and opaque hosts', async () => {
    const rule = Rule.string().uri({allowCredentials: true})
    const accepted = [
      'https://example.com/path%20with%20space',
      'https://example.com/?q=hello%20world#hash%20fragment',
      'https://user%20name@example.com/',
      'https://ex%61mple.com/',
      'https://foo%2Ecom/',
      'https://ex%2Aample.com/',
      'https://a*b.com/',
      'http://[::1]/path%20',
      'http://[::1]:3333/',
      'http://127.0.0.1:8080/a%20b',
      'http://localhost:3333/',
      'https://påtapp.no/oslo',
      'https://b%C3%BCcher.de/',
    ]

    await Promise.all(
      accepted.map((value) => expect(rule.validate(value, context), value).resolves.toEqual([])),
    )

    const linkSchemes = Rule.string().uri({scheme: ['http', 'https', 'tel', 'mailto']})
    for (const value of ['mailto:hi%20there@example.com', 'tel:07480%20589%20950']) {
      await expect(linkSchemes.validate(value, context), value).resolves.toEqual([])
    }

    const opaque = Rule.string().uri({scheme: ['git']})
    await expect(opaque.validate('git://07480%20589%20950/repo', context)).resolves.toEqual([])

    const defaults = Rule.string().uri()
    await expect(defaults.validate('git://07480%20589%20950/repo', context)).resolves.toEqual([
      expect.objectContaining({
        code: 'string.url.scheme-not-allowed',
        message: 'Does not match allowed protocols/schemes',
      }),
    ])
  })

  test('rejects a protocol-relative host with a percent-encoded space', async () => {
    const rule = Rule.string().uri({allowRelative: true})
    await expect(rule.validate('/docs/my%20page', context)).resolves.toEqual([])
    await expect(rule.validate('//07480%20589%20950/path', context)).resolves.toEqual(invalidUrl)
  })
})
