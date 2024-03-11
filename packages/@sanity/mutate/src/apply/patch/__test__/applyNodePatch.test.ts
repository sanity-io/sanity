import {assertType, describe, expect, test} from 'vitest'

import {at} from '../../../mutations/creators'
import {set, setIfMissing} from '../../../mutations/operations/creators'
import {applyNodePatch} from '../applyNodePatch'

describe('set', () => {
  test('simple set', () => {
    const nodePatch = at(['foo'], set('bar' as const))

    const doc = {_id: 'lol', foo: 'foo', _rev: 'ok'} as const

    expect(applyNodePatch(nodePatch, doc)).toEqual({
      _id: 'lol',
      foo: 'bar',
      _rev: 'ok',
    })
  })
  test('set inside object array', () => {
    const document = {
      objects: [
        {_key: 'first', title: 'first'},
        {_key: 'third', title: 'third'},
      ],
    }

    const patch = at('objects[_key=="second"].title', set('Updated'))

    const result = applyNodePatch(patch, document)

    assertType<{_key: string; title: string}[]>(result.objects)
  })
})

describe('setIfMissing', () => {
  test('setIfMissing at root', () => {
    const doc = {}
    expect(applyNodePatch(at(['foo'], setIfMissing('bar')), doc)).toEqual({
      foo: 'bar',
    })
  })

  test('setIfMissing at deeper path', () => {
    const doc = {some: {}}
    expect(
      applyNodePatch(at(['some', 'nested'], setIfMissing({foo: 'bar'})), doc),
    ).toEqual({
      some: {nested: {foo: 'bar'}},
    })
  })

  test('setIfMissing at nonexistent path', () => {
    expect(
      applyNodePatch(
        at(['this', 'path', 'doesnt', 'exist'], setIfMissing({foo: 'bar'})),
        {hello: 'hi!'},
      ),
    ).toEqual({hello: 'hi!'})
  })
})
