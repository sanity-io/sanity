import {type Path, type PathSegment} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {
  findIndex,
  getItemKey,
  getItemKeySegment,
  getValueAtPath,
  isEmptyObject,
  normalizeIndexSegment,
  normalizeIndexTupleSegment,
  normalizeKeySegment,
  normalizePathSegment,
  pathsAreEqual,
  pathToString,
  stringToPath,
} from './helpers'

const document = {
  title: 'Hello',
  authors: [
    {_key: 'a', name: 'Ada'},
    {_key: 'b', name: 'Grace'},
  ],
  body: [{_key: 'p1', children: [{_key: 's1', text: 'one'}]}],
}

describe('pathToString', () => {
  it('joins property names with dots and omits a leading separator', () => {
    expect(pathToString(['title'])).toBe('title')
    expect(pathToString(['seo', 'title'])).toBe('seo.title')
  })

  it('renders numeric indexes and keyed items as bracket segments', () => {
    expect(pathToString(['authors', 0, 'name'])).toBe('authors[0].name')
    expect(pathToString(['authors', {_key: 'a'}, 'name'])).toBe('authors[_key=="a"].name')
  })

  it('renders index tuples, including open ends', () => {
    expect(pathToString(['body', [1, 3]])).toBe('body[1:3]')
    expect(pathToString(['body', ['', 3]])).toBe('body[:3]')
    expect(pathToString(['body', [1, '']])).toBe('body[1:]')
    expect(pathToString(['body', ['', '']])).toBe('body[:]')
  })

  it('returns an empty string for an empty path', () => {
    expect(pathToString([])).toBe('')
  })

  it('throws when the path is not an array', () => {
    expect(() => pathToString('title' as never)).toThrow('Path is not an array')
  })

  it('throws for a segment that is not a property, index, key, or tuple', () => {
    expect(() => pathToString([{foo: 1} as unknown as PathSegment])).toThrow(
      'Unsupported path segment `{"foo":1}`',
    )
  })

  it('throws for a key segment whose _key is empty', () => {
    expect(() => pathToString([{_key: ''}])).toThrow('Unsupported path segment `{"_key":""}`')
  })
})

describe('stringToPath', () => {
  it('parses dotted properties, indexes, keys, and tuples', () => {
    expect(stringToPath('seo.title')).toEqual(['seo', 'title'])
    expect(stringToPath('authors[0].name')).toEqual(['authors', 0, 'name'])
    expect(stringToPath('authors[_key=="a"].name')).toEqual(['authors', {_key: 'a'}, 'name'])
    expect(stringToPath("authors[_key=='a'].name")).toEqual(['authors', {_key: 'a'}, 'name'])
    expect(stringToPath('body[1:3]')).toEqual(['body', [1, 3]])
    expect(stringToPath('body[:3]')).toEqual(['body', ['', 3]])
    expect(stringToPath('body[1:]')).toEqual(['body', [1, '']])
  })

  it('round-trips the path forms the studio writes', () => {
    const paths: Path[] = [
      ['title'],
      ['seo', 'title'],
      ['authors', 0, 'name'],
      ['authors', {_key: 'a'}, 'name'],
      ['body', [1, 3]],
      ['body', ['', 3]],
      ['body', [1, '']],
      ['items', {_key: 'x'}, 'children', 0],
    ]

    for (const path of paths) {
      expect(stringToPath(pathToString(path))).toEqual(path)
    }
  })

  it('throws on an empty string', () => {
    expect(() => stringToPath('')).toThrow('Invalid path string')
  })
})

describe('getValueAtPath', () => {
  it('returns the root value for an empty path', () => {
    expect(getValueAtPath(document, [])).toBe(document)
    expect(getValueAtPath(undefined, [])).toBeUndefined()
  })

  it('walks properties, numeric indexes, and keyed array items', () => {
    expect(getValueAtPath(document, ['title'])).toBe('Hello')
    expect(getValueAtPath(document, ['authors', 1, 'name'])).toBe('Grace')
    expect(getValueAtPath(document, ['authors', {_key: 'a'}, 'name'])).toBe('Ada')
    expect(getValueAtPath(document, ['body', {_key: 'p1'}, 'children', {_key: 's1'}, 'text'])).toBe(
      'one',
    )
  })

  it('returns undefined when a segment cannot be resolved', () => {
    expect(getValueAtPath(document, ['missing'])).toBeUndefined()
    expect(getValueAtPath(document, ['title', 'nope'])).toBeUndefined()
    expect(getValueAtPath(document, ['authors', 9, 'name'])).toBeUndefined()
    expect(getValueAtPath(document, ['authors', {_key: 'missing'}, 'name'])).toBeUndefined()
    expect(getValueAtPath('plain', ['title'])).toBeUndefined()
    expect(getValueAtPath(document, ['title', 0])).toBeUndefined()
    expect(getValueAtPath(document, [{_key: 'a'}])).toBeUndefined()
  })

  it('throws for an index-tuple segment', () => {
    expect(() => getValueAtPath(document, ['authors', [0, 1]])).toThrow(
      'Unknown segment type [0,1]',
    )
  })
})

describe('findIndex', () => {
  const authors = document.authors

  it('returns a numeric segment as-is', () => {
    expect(findIndex(authors, 1)).toBe(1)
    expect(findIndex(authors, 9)).toBe(9)
  })

  it('finds a keyed item or returns -1 when it is absent', () => {
    expect(findIndex(authors, {_key: 'b'})).toBe(1)
    expect(findIndex(authors, {_key: 'missing'})).toBe(-1)
    expect(findIndex([{name: 'no-key'}], {_key: 'a'})).toBe(-1)
  })

  it('returns -1 for property names and index tuples', () => {
    expect(findIndex(authors, 'name')).toBe(-1)
    expect(findIndex(authors, [0, 1])).toBe(-1)
  })
})

describe('normalizePathSegment', () => {
  it('turns bracket indexes into numbers and key / tuple strings into segments', () => {
    expect(normalizePathSegment('[3]')).toBe(3)
    expect(normalizePathSegment('_key=="abc"')).toEqual({_key: 'abc'})
    expect(normalizePathSegment('1:3')).toEqual([1, 3])
    expect(normalizePathSegment('title')).toBe('title')
  })
})

describe('normalizeIndexSegment', () => {
  it('reads the digits out of a bracket index', () => {
    expect(normalizeIndexSegment('[12]')).toBe(12)
    expect(normalizeIndexSegment('7')).toBe(7)
  })
})

describe('normalizeKeySegment', () => {
  it('reads the key from either quote style', () => {
    expect(normalizeKeySegment('_key=="abc"')).toEqual({_key: 'abc'})
    expect(normalizeKeySegment("_key=='abc'")).toEqual({_key: 'abc'})
    expect(normalizeKeySegment('_key == "spaced"')).toEqual({_key: 'spaced'})
  })

  it('throws when the string is not a key segment', () => {
    expect(() => normalizeKeySegment('title')).toThrow('Invalid key segment')
  })
})

describe('normalizeIndexTupleSegment', () => {
  it('parses closed and open ranges', () => {
    expect(normalizeIndexTupleSegment('1:3')).toEqual([1, 3])
    expect(normalizeIndexTupleSegment(':3')).toEqual(['', 3])
    expect(normalizeIndexTupleSegment('1:')).toEqual([1, ''])
    expect(normalizeIndexTupleSegment(':')).toEqual(['', ''])
  })
})

describe('pathsAreEqual', () => {
  it('compares property names, indexes, keys, and tuples', () => {
    expect(pathsAreEqual(['seo', 'title'], ['seo', 'title'])).toBe(true)
    expect(pathsAreEqual(['authors', 0], ['authors', 0])).toBe(true)
    expect(pathsAreEqual(['authors', {_key: 'a'}], ['authors', {_key: 'a'}])).toBe(true)
    expect(pathsAreEqual(['body', [1, 3]], ['body', [1, 3]])).toBe(true)
    expect(pathsAreEqual(['body', ['', 3]], ['body', ['', 3]])).toBe(true)
  })

  it('rejects different lengths, keys, indexes, or tuples', () => {
    expect(pathsAreEqual(['seo'], ['seo', 'title'])).toBe(false)
    expect(pathsAreEqual(['authors', {_key: 'a'}], ['authors', {_key: 'b'}])).toBe(false)
    expect(pathsAreEqual(['authors', 0], ['authors', 1])).toBe(false)
    expect(pathsAreEqual(['body', [1, 3]], ['body', [1, 4]])).toBe(false)
    expect(pathsAreEqual(['authors', {_key: 'a'}], ['authors', 0])).toBe(false)
    expect(pathsAreEqual(['title'], ['name'])).toBe(false)
  })
})

describe('getItemKey and getItemKeySegment', () => {
  it('reads _key from a keyed object and ignores everything else', () => {
    expect(getItemKey({_key: 'a', name: 'Ada'})).toBe('a')
    expect(getItemKeySegment({_key: 'a', name: 'Ada'})).toEqual({_key: 'a'})
    expect(getItemKey({name: 'Ada'})).toBeUndefined()
    expect(getItemKeySegment({name: 'Ada'})).toBeUndefined()
    expect(getItemKey(null)).toBeUndefined()
    expect(getItemKey('a')).toBeUndefined()
    expect(getItemKeySegment({_key: ''})).toBeUndefined()
  })
})

describe('isEmptyObject', () => {
  it('is true only for an object with no own keys', () => {
    expect(isEmptyObject({})).toBe(true)
    expect(isEmptyObject({_key: 'a'})).toBe(false)
    expect(isEmptyObject(null)).toBe(false)
    expect(isEmptyObject(undefined)).toBe(false)
    expect(isEmptyObject('')).toBe(false)
    expect(isEmptyObject(0)).toBe(false)
  })
})
