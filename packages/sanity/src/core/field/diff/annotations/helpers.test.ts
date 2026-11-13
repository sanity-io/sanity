import {diffInput, wrap} from '@sanity/diff'
import {type Path} from '@sanity/types'
import {EMPTY} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {type UserColor, type UserColorManager} from '../../../user-color/types'
import {pathToString} from '../../paths/helpers'
import {type AnnotationDetails, type Diff, type ObjectDiff} from '../../types'
import {getAnnotationAtPath, getAnnotationColor, getDiffAtPath, visitDiff} from './helpers'

const fromAnn: AnnotationDetails = {timestamp: '2020-01-01T00:00:00.000Z', author: 'from-user'}
const toAnn: AnnotationDetails = {timestamp: '2020-01-02T00:00:00.000Z', author: 'to-user'}

type DocumentValue = Record<string, unknown>

function diffDocument(previous: DocumentValue, current: DocumentValue): ObjectDiff {
  return diffInput(wrap(previous, fromAnn), wrap(current, toAnn)) as ObjectDiff
}

function stubColor(userId: string | null): UserColor {
  return {
    name: 'blue',
    background: userId ?? 'anonymous',
    border: '#000',
    text: '#fff',
    tints: {},
  } as UserColor
}

function stubColorManager(seen: (string | null)[]): UserColorManager {
  return {
    get(userId) {
      seen.push(userId)
      return stubColor(userId)
    },
    listen() {
      return EMPTY
    },
  }
}

function collectedPaths(diff: Diff): string[] {
  const paths: string[] = []
  visitDiff(diff, (_node, path) => {
    paths.push(pathToString(path))
    return true
  })
  return paths
}

describe('getDiffAtPath', () => {
  const previous = {
    title: 'Hello',
    author: {name: 'Ada'},
    tags: ['a', 'b'],
    items: [
      {_key: 'one', label: 'One'},
      {_key: 'two', label: 'Two'},
    ],
  }
  const current = {
    title: 'Hallo',
    author: {name: 'Grace'},
    tags: ['a', 'c'],
    items: [
      {_key: 'one', label: 'Uno'},
      {_key: 'two', label: 'Two'},
    ],
  }
  const root = diffDocument(previous, current)

  it('returns the root diff for an empty path', () => {
    expect(getDiffAtPath(root, [])).toBe(root)
  })

  it('resolves a nested object field from a path array or a string', () => {
    const byArray = getDiffAtPath(root, ['author', 'name'])
    const byString = getDiffAtPath(root, 'author.name')

    expect(byArray).toBe(byString)
    expect(byArray).toMatchObject({type: 'string', action: 'changed', toValue: 'Grace'})
  })

  it('resolves an array item by the destination index', () => {
    expect(getDiffAtPath(root, ['tags', 1])).toMatchObject({
      type: 'string',
      toValue: 'c',
    })
  })

  it('resolves a keyed array item by destination index', () => {
    expect(getDiffAtPath(root, ['items', 0, 'label'])).toMatchObject({
      type: 'string',
      action: 'changed',
      toValue: 'Uno',
    })
  })

  it('returns undefined when a field is missing', () => {
    expect(getDiffAtPath(root, ['missing'])).toBeUndefined()
    expect(getDiffAtPath(root, ['author', 'email'])).toBeUndefined()
  })

  it('returns undefined when an array index is missing', () => {
    expect(getDiffAtPath(root, ['tags', 9])).toBeUndefined()
  })

  it('returns undefined when an index segment is applied to a non-array', () => {
    expect(getDiffAtPath(root, ['title', 0])).toBeUndefined()
  })

  it('returns undefined when a property segment is applied to a non-object', () => {
    expect(getDiffAtPath(root, ['title', 'length'])).toBeUndefined()
  })

  it('throws when the path contains an index tuple', () => {
    expect(() => getDiffAtPath(root, ['tags', [0, 1] as Path[number]])).toThrow(
      'Index tuples are not supported in diff paths',
    )
  })
})

describe('getDiffAtPath keyed array items', () => {
  const root = diffDocument(
    {
      items: [
        {_key: 'one', label: 'One'},
        {_key: 'two', label: 'Two'},
      ],
    },
    {
      items: [
        {_key: 'one', label: 'Uno'},
        {_key: 'two', label: 'Two'},
      ],
    },
  )

  it.fails('resolves a keyed array item by {_key} the way form paths do', () => {
    expect(getDiffAtPath(root, ['items', {_key: 'one'}, 'label'])).toMatchObject({
      type: 'string',
      action: 'changed',
      toValue: 'Uno',
    })
  })
})

describe('getAnnotationAtPath', () => {
  const root = diffDocument({title: 'Hello', body: 'same'}, {title: 'Hallo', body: 'same'})

  it('returns undefined for an unchanged field', () => {
    expect(getAnnotationAtPath(root, ['body'])).toBeUndefined()
  })

  it('returns the destination annotation for a changed field', () => {
    expect(getAnnotationAtPath(root, ['title'])).toEqual(toAnn)
  })

  it('returns undefined when the path does not resolve', () => {
    expect(getAnnotationAtPath(root, ['missing'])).toBeUndefined()
  })
})

describe('visitDiff', () => {
  it('calls the visitor on changed fields and on unchanged siblings of a changed object', () => {
    const root = diffDocument({title: 'Hello', body: 'same'}, {title: 'Hallo', body: 'same'})
    const paths = collectedPaths(root)

    expect(paths[0]).toBe('')
    expect(paths).toContain('title')
    expect(paths).toContain('body')
  })

  it('stops descending when the visitor returns false', () => {
    const root = diffDocument({author: {name: 'Ada'}}, {author: {name: 'Grace'}})
    const paths: string[] = []

    visitDiff(root, (_node, path) => {
      paths.push(pathToString(path))
      return false
    })

    expect(paths).toEqual([''])
  })

  it('visits unkeyed array items by index', () => {
    const root = diffDocument({tags: ['a', 'b']}, {tags: ['a', 'c']})
    const paths = collectedPaths(root)

    expect(paths).toContain('tags')
    expect(paths).toContain('tags[0]')
    expect(paths).toContain('tags[1]')
  })

  it('visits keyed array items by {_key} from the destination value', () => {
    const root = diffDocument(
      {items: [{_key: 'one', label: 'One'}]},
      {items: [{_key: 'one', label: 'Uno'}]},
    )
    const paths = collectedPaths(root)

    expect(paths).toContain('items[_key=="one"]')
    expect(paths).toContain('items[_key=="one"].label')
  })

  it('visits changed string segments', () => {
    const root = diffDocument({title: 'Hello'}, {title: 'Hallo'})
    const kinds: string[] = []

    visitDiff(root, (node) => {
      kinds.push(node.type)
      return true
    })

    expect(kinds).toContain('string')
    expect(kinds.some((type) => type !== 'object' && type !== 'string')).toBe(true)
  })
})

describe('getAnnotationColor', () => {
  it('asks the color manager for the annotation author', () => {
    const seen: (string | null)[] = []
    const color = getAnnotationColor(stubColorManager(seen), toAnn)

    expect(seen).toEqual(['to-user'])
    expect(color.background).toBe('to-user')
  })

  it('asks the color manager for null when the annotation is missing', () => {
    const seen: (string | null)[] = []
    getAnnotationColor(stubColorManager(seen), undefined)
    getAnnotationColor(stubColorManager(seen), null)

    expect(seen).toEqual([null, null])
  })
})
