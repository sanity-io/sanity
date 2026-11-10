import {describe, expect, it} from 'vitest'

import {describeKeypath, getAtKeypath} from './getAtKeypath'

describe('describeKeypath', () => {
  it('writes array indexes in brackets and keys after dots', () => {
    expect(describeKeypath('0')).toBe('[0]')
    expect(describeKeypath('0.author.tags.1')).toBe('[0].author.tags[1]')
    expect(describeKeypath('author.name')).toBe('author.name')
  })
})

const data = [
  {
    '_id': 'a',
    'author': {name: 'Ada', tags: ['math', 'poetry']},
    'meta.title': 'Dotted',
    'meta': {x: 1},
  },
]

describe('getAtKeypath', () => {
  it('follows the path through objects and arrays', () => {
    expect(getAtKeypath(data, '0.author.name')).toEqual({value: 'Ada'})
    expect(getAtKeypath(data, '0.author.tags.1')).toEqual({value: 'poetry'})
    expect(getAtKeypath(data, '0.author')).toEqual({value: {name: 'Ada', tags: ['math', 'poetry']}})
  })

  it('is the whole value for the root', () => {
    expect(getAtKeypath(data, '')).toEqual({value: data})
  })

  it('prefers a key that contains a dot over a nested path', () => {
    expect(getAtKeypath(data, '0.meta.title')).toEqual({value: 'Dotted'})
    expect(getAtKeypath(data, '0.meta.x')).toEqual({value: 1})
  })

  it('keeps a value that is null or false, and finds nothing past the end', () => {
    expect(getAtKeypath({a: null, b: false}, 'a')).toEqual({value: null})
    expect(getAtKeypath({a: null, b: false}, 'b')).toEqual({value: false})
    expect(getAtKeypath(data, '0.author.name.first')).toBeUndefined()
    expect(getAtKeypath(data, '1')).toBeUndefined()
  })
})
