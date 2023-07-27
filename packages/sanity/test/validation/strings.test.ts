import {getFallbackLocaleSource} from '../../src/core/i18n/fallback'
import {Rule} from '../../src/core/validation'

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
      'exact length: too long'
    )
    await expect(rule.validate('abc', context)).resolves.toMatchSnapshot('exact length: too short')
    await expect(rule.validate('abcde', context)).resolves.toMatchSnapshot('exact length: valid')
  })

  test('uppercase constraint', async () => {
    const rule = Rule.string().uppercase()
    await expect(rule.validate('sanity', context)).resolves.toMatchSnapshot(
      'uppercase: all lowercase'
    )
    await expect(rule.validate('Sanity', context)).resolves.toMatchSnapshot(
      'uppercase: some lowercase'
    )
    await expect(rule.validate('Sanity', context)).resolves.toMatchSnapshot(
      'uppercase: some lowercase'
    )
    await expect(rule.validate('SäNITY', context)).resolves.toMatchSnapshot(
      'uppercase: locale characters'
    )
    await expect(rule.validate('SANITY', context)).resolves.toMatchSnapshot('uppercase: valid')
  })

  test('lowercase constraint', async () => {
    const rule = Rule.string().lowercase()
    await expect(rule.validate('SANITY', context)).resolves.toMatchSnapshot(
      'lowercase: all uppercase'
    )
    await expect(rule.validate('Sanity', context)).resolves.toMatchSnapshot(
      'lowercase: some uppercase'
    )
    await expect(rule.validate('sÄnity', context)).resolves.toMatchSnapshot(
      'lowercase: locale characters'
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
      'regex: inverted non-match'
    )
    await expect(rule.validate('Sanity', context)).resolves.toMatchSnapshot('regex: inverted match')
  })

  test('regex constraint (custom pattern name)', async () => {
    const rule = Rule.string().regex(/^[A-Z][a-z]+$/, 'PascalCase')
    await expect(rule.validate('SANITY', context)).resolves.toMatchSnapshot(
      'regex: non-match w/ custom pattern name'
    )
    await expect(rule.validate('Sanity', context)).resolves.toMatchSnapshot(
      'regex: match w/ custom pattern name'
    )
  })

  test('regex constraint (custom pattern name, as options)', async () => {
    const rule = Rule.string().regex(/^[A-Z][a-z]+$/, {name: 'PascalCase'})
    await expect(rule.validate('SANITY', context)).resolves.toMatchSnapshot(
      'regex: non-match w/ custom pattern name (opt)'
    )
    await expect(rule.validate('Sanity', context)).resolves.toMatchSnapshot(
      'regex: match w/ custom pattern name (opt)'
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
      'uri: non-match'
    )
    await expect(
      rule.validate('https://en.wikipedia.org/wiki/San_&_Søn', context)
    ).resolves.toHaveLength(0)
    await expect(
      rule.validate('https://zh.wikipedia.org/wiki/心形符號', context)
    ).resolves.toHaveLength(0)
    await expect(
      rule.validate('https://ru.wikipedia.org/wiki/Зонтичные', context)
    ).resolves.toHaveLength(0)
    await expect(rule.validate('https://påtapp.no/oslo', context)).resolves.toHaveLength(0)
  })

  test('uri constraint (invalid protocol)', async () => {
    const rule = Rule.string().uri({scheme: ['http', 'ftp']})
    await expect(rule.validate('https://sanity.io/', context)).resolves.toMatchSnapshot(
      'uri: protocol non-match'
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
      'uri: credentials specified but not allowed'
    )
    await expect(rule.validate('http://espen@sanity.io/', context)).resolves.toMatchSnapshot(
      'uri: username specified but not allowed'
    )
  })

  test('custom rule with string', async () => {
    const rule = Rule.string().custom<string>((val) =>
      val.split('').reverse().join('') === val ? true : 'Must be a palindrome!'
    )

    await expect(rule.validate('hei', context)).resolves.toMatchSnapshot('not a palindrome')
    await expect(rule.validate('madam', context)).resolves.toHaveLength(0)
  })

  test('custom async rule with string', async () => {
    const rule = Rule.string().custom<string>(
      (val) =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(val.split('').reverse().join('') === val ? true : 'Must be a palindrome!'),
            50
          )
        )
    )

    await expect(rule.validate('hei', context)).resolves.toMatchSnapshot('not a palindrome')
    await expect(rule.validate('madam', context)).resolves.toHaveLength(0)
  })
})
