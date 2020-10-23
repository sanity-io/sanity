import {fieldNeedsEscape, escapeField, joinPath} from '../src/util/searchUtils'

test('fieldNeedsEscape', () => {
  expect(fieldNeedsEscape('0foo')).toBe(true)
  expect(fieldNeedsEscape('foo bar')).toBe(true)
  expect(fieldNeedsEscape('0')).toBe(true)

  expect(fieldNeedsEscape('foobar')).toBe(false)
  expect(fieldNeedsEscape('foobar123')).toBe(false)

  // Keywords
  ;[('match', 'in', 'asc', 'desc', 'true', 'false', 'null')].forEach((kw) => {
    expect(fieldNeedsEscape(kw)).toBe(true)
  })
})

test('escapeField', () => {
  expect(escapeField('0foo')).toBe('["0foo"]')
  expect(escapeField('foo bar')).toBe('["foo bar"]')
  expect(escapeField('0')).toBe('["0"]')

  expect(escapeField('foobar')).toBe('["foobar"]')

  // Keywords
  ;[('match', 'in', 'asc', 'desc', 'true', 'false', 'null')].forEach((kw) => {
    expect(escapeField(kw)).toBe(`["${kw}"]`)
  })
})

test('joinPath', () => {
  expect(joinPath(['asc', 'foo', 'bar'])).toBe('@["asc"].foo.bar')
  expect(joinPath(['foo', 'asc', 'bar'])).toBe('foo["asc"].bar')
  expect(joinPath(['array', []])).toBe('array[]')
  expect(joinPath(['array', [], 'bar'])).toBe('array[].bar')
  expect(joinPath(['foo', [], 'asc', 'bar'])).toBe('foo[]["asc"].bar')
  expect(joinPath(['match', 'in', 'asc', 'desc', 'true', 'false', 'null'])).toBe(
    '@["match"]["in"]["asc"]["desc"]["true"]["false"]["null"]'
  )
})
