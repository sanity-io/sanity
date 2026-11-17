import {describe, expect, test} from 'vitest'

import {normalizeReproPath, withReproPath} from './reproPath'

const PREVIEW = 'https://test-studio-git-abc123-sanity-io.vercel.app'

describe('normalizeReproPath', () => {
  test('blank input is no path', () => {
    expect(normalizeReproPath('')).toBeUndefined()
    expect(normalizeReproPath('   ')).toBeUndefined()
    expect(normalizeReproPath('/')).toBeUndefined()
  })

  test('adds the leading slash and keeps query and hash', () => {
    expect(normalizeReproPath('test/structure/author;abc')).toBe('/test/structure/author;abc')
    expect(normalizeReproPath(' /test/desk?perspective=x#y ')).toBe('/test/desk?perspective=x#y')
  })

  test('a pasted test-studio URL is reduced to its path', () => {
    expect(
      normalizeReproPath('https://test-studio.sanity.dev/test/structure/author;abc?x=1#h'),
    ).toBe('/test/structure/author;abc?x=1#h')
    expect(normalizeReproPath('http://localhost:3333/test')).toBe('/test')
    expect(normalizeReproPath('https://test-studio.sanity.dev')).toBeUndefined()
  })

  test('keeps only the path of anything that names a host or scheme', () => {
    expect(normalizeReproPath('//evil.example/x')).toBe('/x')
    expect(normalizeReproPath('\\\\evil.example/x')).toBe('/x')
    expect(normalizeReproPath('/\\evil.example/x')).toBe('/x')
    expect(normalizeReproPath('javascript:alert(1)')).toBe('/alert(1)')
  })
})

const HOSTILE = [
  '//evil.example/x',
  '\\\\evil.example/x',
  '/\\evil.example/x',
  '/\\/evil.example/x',
  '\\/evil.example/x',
  '///evil.example/x',
  'javascript:alert(1)',
  'https://evil.example/x',
]

describe('withReproPath', () => {
  test('no path returns the preview URL untouched', () => {
    expect(withReproPath(PREVIEW, undefined)).toBe(PREVIEW)
    expect(withReproPath(PREVIEW, '  ')).toBe(PREVIEW)
  })

  test('appends the path to the preview origin', () => {
    expect(withReproPath(PREVIEW, '/test/structure/author;abc?x=1#h')).toBe(
      `${PREVIEW}/test/structure/author;abc?x=1#h`,
    )
    expect(withReproPath(`${PREVIEW}/`, 'test/desk')).toBe(`${PREVIEW}/test/desk`)
  })

  test('a stored preview URL that does not parse is returned untouched instead of throwing', () => {
    expect(withReproPath('https://', '/test/desk')).toBe('https://')
    expect(withReproPath('https://[bad', '/test/desk')).toBe('https://[bad')
  })

  test.each(HOSTILE)('stays on the preview origin for %j', (input) => {
    const url = new URL(withReproPath(PREVIEW, input))
    expect(url.origin).toBe(PREVIEW)
    expect(url.protocol).toBe('https:')
  })
})
