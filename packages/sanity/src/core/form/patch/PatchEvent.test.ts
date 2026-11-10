import {describe, expect, test} from 'vitest'

import {insert, set, setIfMissing, unset} from './patch'
import {PatchEvent} from './PatchEvent'

describe('PatchEvent', () => {
  test('from returns the same instance when given a PatchEvent', () => {
    const event = PatchEvent.from(set('Hello', ['title']))
    expect(PatchEvent.from(event)).toBe(event)
  })

  test('from wraps a single patch', () => {
    const patch = set('Hello', ['title'])
    expect(PatchEvent.from(patch).patches).toEqual([patch])
  })

  test('prepend flattens a nested patch array one level', () => {
    const first = set('Hello', ['title'])
    const second = unset(['count'])
    expect(PatchEvent.from(first).prepend([second]).patches).toEqual([second, first])
  })

  test('prepend inserts patches ahead of the existing ones', () => {
    const event = PatchEvent.from(set('Hello', ['title'])).prepend(setIfMissing({}))
    expect(event.patches.map((patch) => patch.type)).toEqual(['setIfMissing', 'set'])
  })

  test('append adds patches after the existing ones and flattens arguments', () => {
    const event = PatchEvent.from(setIfMissing([])).append(insert(['a'], 'after', [0]), [
      unset([1]),
    ])
    expect(event.patches.map((patch) => patch.type)).toEqual(['setIfMissing', 'insert', 'unset'])
  })

  test('prefixAll prepends a path segment onto every patch', () => {
    const event = PatchEvent.from([set('Hello', ['title']), unset(['count'])]).prefixAll('body')
    expect(event.patches.map((patch) => patch.path)).toEqual([
      ['body', 'title'],
      ['body', 'count'],
    ])
  })

  test('prefixAll accepts a key selector as the prefix', () => {
    const event = PatchEvent.from(set('Bee', ['title'])).prefixAll({_key: 'b'})
    expect(event.patches[0].path).toEqual([{_key: 'b'}, 'title'])
  })

  test('from, prepend and prefixAll compose the setIfMissing-then-field pattern used by array members', () => {
    const event = PatchEvent.from(unset([{_key: 'a'}]))
      .prepend(setIfMissing([]))
      .prefixAll('items')

    expect(event.patches).toEqual([setIfMissing([], ['items']), unset(['items', {_key: 'a'}])])
  })
})
