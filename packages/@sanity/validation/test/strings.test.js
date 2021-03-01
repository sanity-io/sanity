const {Rule} = require('../src')

describe('string', () => {
  test('required constraint', async () => {
    const rule = Rule.string().required()
    await expect(rule.validate('')).resolves.toMatchSnapshot('required: empty string')
    await expect(rule.validate(null)).resolves.toMatchSnapshot('required: null')
    await expect(rule.validate(undefined)).resolves.toMatchSnapshot('required: undefined')
    await expect(rule.validate('abc')).resolves.toMatchSnapshot('required: valid')
  })

  test('min length constraint', async () => {
    const rule = Rule.string().min(2)
    await expect(rule.validate('a')).resolves.toMatchSnapshot('min length: too short')
    await expect(rule.validate('abc')).resolves.toMatchSnapshot('min length: valid')
  })

  test('max length constraint', async () => {
    const rule = Rule.string().max(5)
    await expect(rule.validate('abcdefg')).resolves.toMatchSnapshot('max length: too long')
    await expect(rule.validate('abc')).resolves.toMatchSnapshot('max length: valid')
  })

  test('exact length constraint', async () => {
    const rule = Rule.string().length(5)
    await expect(rule.validate('abcdefgh')).resolves.toMatchSnapshot('exact length: too long')
    await expect(rule.validate('abc')).resolves.toMatchSnapshot('exact length: too short')
    await expect(rule.validate('abcde')).resolves.toMatchSnapshot('exact length: valid')
  })

  test('uppercase constraint', async () => {
    const rule = Rule.string().uppercase()
    await expect(rule.validate('sanity')).resolves.toMatchSnapshot('uppercase: all lowercase')
    await expect(rule.validate('Sanity')).resolves.toMatchSnapshot('uppercase: some lowercase')
    await expect(rule.validate('Sanity')).resolves.toMatchSnapshot('uppercase: some lowercase')
    await expect(rule.validate('SäNITY')).resolves.toMatchSnapshot('uppercase: locale characters')
    await expect(rule.validate('SANITY')).resolves.toMatchSnapshot('uppercase: valid')
  })

  test('lowercase constraint', async () => {
    const rule = Rule.string().lowercase()
    await expect(rule.validate('SANITY')).resolves.toMatchSnapshot('lowercase: all uppercase')
    await expect(rule.validate('Sanity')).resolves.toMatchSnapshot('lowercase: some uppercase')
    await expect(rule.validate('sÄnity')).resolves.toMatchSnapshot('lowercase: locale characters')
    await expect(rule.validate('sanity')).resolves.toMatchSnapshot('lowercase: valid')
  })

  test('regex constraint', async () => {
    const rule = Rule.string().regex(/^[A-Z][a-z]+$/)
    await expect(rule.validate('SANITY')).resolves.toMatchSnapshot('regex: non-match')
    await expect(rule.validate('Sanity')).resolves.toMatchSnapshot('regex: match')
  })

  test('regex constraint (inverted)', async () => {
    const rule = Rule.string().regex(/^[A-Z][a-z]+$/, {invert: true})
    await expect(rule.validate('SANITY')).resolves.toMatchSnapshot('regex: inverted non-match')
    await expect(rule.validate('Sanity')).resolves.toMatchSnapshot('regex: inverted match')
  })

  test('regex constraint (custom pattern name)', async () => {
    const rule = Rule.string().regex(/^[A-Z][a-z]+$/, 'PascalCase')
    await expect(rule.validate('SANITY')).resolves.toMatchSnapshot(
      'regex: non-match w/ custom pattern name'
    )
    await expect(rule.validate('Sanity')).resolves.toMatchSnapshot(
      'regex: match w/ custom pattern name'
    )
  })

  test('regex constraint (custom pattern name, as options)', async () => {
    const rule = Rule.string().regex(/^[A-Z][a-z]+$/, {name: 'PascalCase'})
    await expect(rule.validate('SANITY')).resolves.toMatchSnapshot(
      'regex: non-match w/ custom pattern name (opt)'
    )
    await expect(rule.validate('Sanity')).resolves.toMatchSnapshot(
      'regex: match w/ custom pattern name (opt)'
    )
  })

  test('uri constraint', async () => {
    const rule = Rule.string().uri()
    await expect(rule.validate('SANITY')).resolves.toMatchSnapshot('uri: non-match')
    await expect(rule.validate('https://sanity.io/')).resolves.toHaveLength(0)
  })

  test('uri constraint (with unicode chars)', async () => {
    const rule = Rule.string().uri()
    await expect(rule.validate('Blåbærsyltetøy')).resolves.toMatchSnapshot('uri: non-match')
    await expect(rule.validate('https://en.wikipedia.org/wiki/San_&_Søn')).resolves.toHaveLength(0)
    await expect(rule.validate('https://zh.wikipedia.org/wiki/心形符號')).resolves.toHaveLength(0)
    await expect(rule.validate('https://ru.wikipedia.org/wiki/Зонтичные')).resolves.toHaveLength(0)
    await expect(rule.validate('https://påtapp.no/oslo')).resolves.toHaveLength(0)
  })

  test('uri constraint (invalid protocol)', async () => {
    const rule = Rule.string().uri({scheme: ['http', 'ftp']})
    await expect(rule.validate('https://sanity.io/')).resolves.toMatchSnapshot(
      'uri: protocol non-match'
    )
    await expect(rule.validate('ftp://code.sanity.io/')).resolves.toHaveLength(0)
  })

  test('uri constraint (credentials)', async () => {
    let rule = Rule.string().uri({allowCredentials: true})
    await expect(rule.validate('http://foo:bar@sanity.io/')).resolves.toHaveLength(0)
    await expect(rule.validate('http://sanity.io/')).resolves.toHaveLength(0)

    rule = Rule.string().uri({allowCredentials: false})
    await expect(rule.validate('http://sanity.io/')).resolves.toHaveLength(0)
    await expect(rule.validate('http://foo:bar@sanity.io/')).resolves.toMatchSnapshot(
      'uri: credentials specified but not allowed'
    )
    await expect(rule.validate('http://espen@sanity.io/')).resolves.toMatchSnapshot(
      'uri: username specified but not allowed'
    )
  })

  test('custom rule with string', async () => {
    const rule = Rule.string().custom((val) =>
      val.split('').reverse().join('') === val ? true : 'Must be a palindrome!'
    )

    await expect(rule.validate('hei')).resolves.toMatchSnapshot('not a palindrome')
    await expect(rule.validate('madam')).resolves.toHaveLength(0)
  })

  test('custom async rule with string', async () => {
    const rule = Rule.string().custom(
      (val) =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(val.split('').reverse().join('') === val ? true : 'Must be a palindrome!'),
            50
          )
        )
    )

    await expect(rule.validate('hei')).resolves.toMatchSnapshot('not a palindrome')
    await expect(rule.validate('madam')).resolves.toHaveLength(0)
  })
})
