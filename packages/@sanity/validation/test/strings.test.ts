import {describe, expect, test} from 'vitest'

import {getFallbackLocaleSource, Rule} from '../src/_internal'

const context: any = {client: {}, i18n: getFallbackLocaleSource()}

describe('string', () => {
  test('required constraint', async () => {
    const rule = Rule.string().required()
    await expect(rule.validate('', context)).resolves.toMatchSnapshot('required: empty string')
    await expect(rule.validate(null, context)).resolves.toMatchSnapshot('required: null')
    await expect(rule.validate(undefined, context)).resolves.toMatchSnapshot('required: undefined')
    await expect(rule.validate('abc', context)).resolves.toMatchSnapshot('required: valid')
  })

  test('min length constraint', async () => {
    const rule = Rule.string().min(2)
    await expect(rule.validate('a', context)).resolves.toMatchSnapshot('min length: too short')
    await expect(rule.validate('abc', context)).resolves.toMatchSnapshot('min length: valid')
  })

  test('max length constraint', async () => {
    const rule = Rule.string().max(5)
    await expect(rule.validate('abcdefg', context)).resolves.toMatchSnapshot('max length: too long')
    await expect(rule.validate('abc', context)).resolves.toMatchSnapshot('max length: valid')
  })

  test('exact length constraint', async () => {
    const rule = Rule.string().length(5)
    await expect(rule.validate('abcdefgh', context)).resolves.toMatchSnapshot(
      'exact length: too long',
    )
    await expect(rule.validate('abc', context)).resolves.toMatchSnapshot('exact length: too short')
    await expect(rule.validate('abcde', context)).resolves.toMatchSnapshot('exact length: valid')
  })

  test('uppercase constraint', async () => {
    const rule = Rule.string().uppercase()
    await expect(rule.validate('sanity', context)).resolves.toMatchSnapshot(
      'uppercase: all lowercase',
    )
    await expect(rule.validate('Sanity', context)).resolves.toMatchSnapshot(
      'uppercase: some lowercase',
    )
    await expect(rule.validate('Sanity', context)).resolves.toMatchSnapshot(
      'uppercase: some lowercase',
    )
    await expect(rule.validate('SäNITY', context)).resolves.toMatchSnapshot(
      'uppercase: locale characters',
    )
    await expect(rule.validate('SANITY', context)).resolves.toMatchSnapshot('uppercase: valid')
  })

  test('lowercase constraint', async () => {
    const rule = Rule.string().lowercase()
    await expect(rule.validate('SANITY', context)).resolves.toMatchSnapshot(
      'lowercase: all uppercase',
    )
    await expect(rule.validate('Sanity', context)).resolves.toMatchSnapshot(
      'lowercase: some uppercase',
    )
    await expect(rule.validate('sÄnity', context)).resolves.toMatchSnapshot(
      'lowercase: locale characters',
    )
    await expect(rule.validate('sanity', context)).resolves.toMatchSnapshot('lowercase: valid')
  })

  test('regex constraint', async () => {
    const rule = Rule.string().regex(/^[A-Z][a-z]+$/)
    await expect(rule.validate('SANITY', context)).resolves.toMatchSnapshot('regex: non-match')
    await expect(rule.validate('Sanity', context)).resolves.toMatchSnapshot('regex: match')
  })

  test('regex constraint (inverted)', async () => {
    const rule = Rule.string().regex(/^[A-Z][a-z]+$/, {invert: true})
    await expect(rule.validate('SANITY', context)).resolves.toMatchSnapshot(
      'regex: inverted non-match',
    )
    await expect(rule.validate('Sanity', context)).resolves.toMatchSnapshot('regex: inverted match')
  })

  test('regex constraint (custom pattern name)', async () => {
    const rule = Rule.string().regex(/^[A-Z][a-z]+$/, 'PascalCase')
    await expect(rule.validate('SANITY', context)).resolves.toMatchSnapshot(
      'regex: non-match w/ custom pattern name',
    )
    await expect(rule.validate('Sanity', context)).resolves.toMatchSnapshot(
      'regex: match w/ custom pattern name',
    )
  })

  test('regex constraint (custom pattern name, as options)', async () => {
    const rule = Rule.string().regex(/^[A-Z][a-z]+$/, {name: 'PascalCase'})
    await expect(rule.validate('SANITY', context)).resolves.toMatchSnapshot(
      'regex: non-match w/ custom pattern name (opt)',
    )
    await expect(rule.validate('Sanity', context)).resolves.toMatchSnapshot(
      'regex: match w/ custom pattern name (opt)',
    )
  })

  test('uri constraint', async () => {
    const rule = Rule.string().uri()
    await expect(rule.validate('SANITY', context)).resolves.toMatchSnapshot('uri: non-match')
    await expect(rule.validate('https://sanity.io/', context)).resolves.toHaveLength(0)
  })

  test('uri constraint (with unicode chars)', async () => {
    const rule = Rule.string().uri()
    await expect(rule.validate('Blåbærsyltetøy', context)).resolves.toMatchSnapshot(
      'uri: non-match',
    )
    await expect(
      rule.validate('https://en.wikipedia.org/wiki/San_&_Søn', context),
    ).resolves.toHaveLength(0)
    await expect(
      rule.validate('https://zh.wikipedia.org/wiki/心形符號', context),
    ).resolves.toHaveLength(0)
    await expect(
      rule.validate('https://ru.wikipedia.org/wiki/Зонтичные', context),
    ).resolves.toHaveLength(0)
    await expect(rule.validate('https://påtapp.no/oslo', context)).resolves.toHaveLength(0)
  })

  test('uri constraint (invalid protocol)', async () => {
    const rule = Rule.string().uri({scheme: ['http', 'ftp']})
    await expect(rule.validate('https://sanity.io/', context)).resolves.toMatchSnapshot(
      'uri: protocol non-match',
    )
    await expect(rule.validate('ftp://code.sanity.io/', context)).resolves.toHaveLength(0)
  })

  test('uri constraint (credentials)', async () => {
    let rule = Rule.string().uri({allowCredentials: true})
    await expect(rule.validate('http://foo:bar@sanity.io/', context)).resolves.toHaveLength(0)
    await expect(rule.validate('http://sanity.io/', context)).resolves.toHaveLength(0)

    rule = Rule.string().uri({allowCredentials: false})
    await expect(rule.validate('http://sanity.io/', context)).resolves.toHaveLength(0)
    await expect(rule.validate('http://foo:bar@sanity.io/', context)).resolves.toMatchSnapshot(
      'uri: credentials specified but not allowed',
    )
    await expect(rule.validate('http://espen@sanity.io/', context)).resolves.toMatchSnapshot(
      'uri: username specified but not allowed',
    )
  })

  test('uri constraint rejects percent-encoded spaces in a special-scheme hostname', async () => {
    const rule = Rule.string().uri()
    const rejected = [
      'https://07480%20589%20950/',
      'https://f%20you%20leave%20freephase%20dynamic,%20you%20won%27t%20be%20able%20to%20rejoin/',
      'https://link%20https://cdn-www.pod-point.com/policy.pdf',
      'https://exa mple.com/',
      'https://example.com%20/',
      'ftp://07480%20589%20950/file',
      'ws://07480%20589%20950/socket',
    ]

    await Promise.all(
      rejected.map((value) =>
        expect(rule.validate(value, context), value).resolves.toEqual([
          expect.objectContaining({
            code: 'string.url.invalid',
            level: 'error',
            message: 'Not a valid URL',
          }),
        ]),
      ),
    )

    // A special scheme outside the default http/https list is a scheme mismatch
    // when the host itself is fine. The `%20` cases above stay "Not a valid URL".
    await expect(rule.validate('ws://example.com/socket', context)).resolves.toEqual([
      expect.objectContaining({
        code: 'string.url.scheme-not-allowed',
        message: 'Does not match allowed protocols/schemes',
      }),
    ])
  })

  test('uri constraint allows percent-encoded spaces outside the hostname', async () => {
    const rule = Rule.string().uri({allowCredentials: true})
    await expect(
      rule.validate('https://example.com/path%20with%20space', context),
    ).resolves.toHaveLength(0)
    await expect(
      rule.validate('https://example.com/?q=hello%20world#hash%20fragment', context),
    ).resolves.toHaveLength(0)
    await expect(rule.validate('https://user%20name@example.com/', context)).resolves.toHaveLength(
      0,
    )
    await expect(rule.validate('https://ex%61mple.com/', context)).resolves.toHaveLength(0)
    await expect(rule.validate('https://foo%2Ecom/', context)).resolves.toHaveLength(0)
    // Node decodes `%2A` to `*`. Chrome keeps `%2A` in the hostname. Neither is a space.
    await expect(rule.validate('https://ex%2Aample.com/', context)).resolves.toHaveLength(0)
    await expect(rule.validate('http://[::1]/path%20', context)).resolves.toHaveLength(0)
    await expect(rule.validate('http://127.0.0.1:8080/a%20b', context)).resolves.toHaveLength(0)
  })

  test('uri constraint allows percent-encoded spaces in opaque hosts', async () => {
    const allowed = Rule.string().uri({scheme: ['git', 'ssh']})
    await expect(allowed.validate('git://07480%20589%20950/repo', context)).resolves.toHaveLength(0)
    await expect(allowed.validate('ssh://07480%20589%20950/repo', context)).resolves.toHaveLength(0)

    // Default schemes are http/https. The opaque host parses, then the scheme check
    // reports the mismatch. It must not be collapsed into "Not a valid URL".
    const defaults = Rule.string().uri()
    await expect(defaults.validate('git://07480%20589%20950/repo', context)).resolves.toEqual([
      expect.objectContaining({
        code: 'string.url.scheme-not-allowed',
        message: 'Does not match allowed protocols/schemes',
      }),
    ])
  })

  test('uri constraint (allowRelative) rejects a protocol-relative host with a percent-encoded space', async () => {
    const rule = Rule.string().uri({allowRelative: true})
    await expect(rule.validate('/docs/my%20page', context)).resolves.toHaveLength(0)
    await expect(rule.validate('//07480%20589%20950/path', context)).resolves.toEqual([
      expect.objectContaining({
        code: 'string.url.invalid',
        message: 'Not a valid URL',
      }),
    ])
  })

  test('uri constraint (allowRelative with restrictive scheme)', async () => {
    const rule = Rule.string().uri({scheme: ['https'], allowRelative: true})
    await expect(rule.validate('/example', context)).resolves.toHaveLength(0)
    await expect(rule.validate('https://example.com', context)).resolves.toHaveLength(0)
    await expect(rule.validate('http://example.com', context)).resolves.toMatchSnapshot(
      'uri: absolute URL still rejects disallowed scheme',
    )
  })

  test('custom rule with string', async () => {
    const rule = Rule.string().custom<string>((val) =>
      val.split('').reverse().join('') === val ? true : 'Must be a palindrome!',
    )

    await expect(rule.validate('hei', context)).resolves.toMatchSnapshot('not a palindrome')
    await expect(rule.validate('madam', context)).resolves.toHaveLength(0)
  })

  test('custom async rule with string', async () => {
    const rule = Rule.string().custom<string>(async (val) => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return val.split('').reverse().join('') === val ? true : 'Must be a palindrome!'
    })

    await expect(rule.validate('hei', context)).resolves.toMatchSnapshot('not a palindrome')
    await expect(rule.validate('madam', context)).resolves.toHaveLength(0)
  })
})
