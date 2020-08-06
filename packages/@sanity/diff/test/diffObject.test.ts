import {diffObject} from '../src/calculate/diffObject'

describe('diffObject', () => {
  test('returns correct from/to value', () => {
    expect(diffObject({foo: 123}, {foo: 321})).toMatchInlineSnapshot(`
      Object {
        "fields": Object {
          "foo": Object {
            "fromValue": 123,
            "isChanged": true,
            "path": Array [
              "foo",
            ],
            "toValue": 321,
            "type": "number",
          },
        },
        "fromValue": Object {
          "foo": 123,
        },
        "isChanged": true,
        "path": Array [],
        "toValue": Object {
          "foo": 321,
        },
        "type": "object",
      }
    `)
  })

  test('handles null/undefined values', () => {
    expect(diffObject({source: 'value'}, null)).toMatchObject({
      type: 'object',
      fromValue: {source: 'value'},
      toValue: null,
      isChanged: true
    })

    expect(diffObject({source: 'value'}, undefined)).toMatchObject({
      type: 'object',
      fromValue: {source: 'value'},
      toValue: undefined,
      isChanged: true
    })

    expect(diffObject(undefined, {source: 'value'})).toMatchObject({
      type: 'object',
      fromValue: undefined,
      toValue: {source: 'value'},
      isChanged: true
    })

    expect(diffObject(null, undefined)).toMatchObject({
      type: 'object',
      fromValue: null,
      toValue: undefined,
      isChanged: true
    })
  })

  test('returns correct isChanged value', () => {
    expect(diffObject({foo: 'bar'}, {foo: 'bar'}).isChanged).toBe(false)
    expect(diffObject({foo: 'bar'}, {foo: 'baz'}).isChanged).toBe(true)
    expect(diffObject({foo: 'bar'}, {baz: 'bar'}).isChanged).toBe(true)
    expect(diffObject({foo: 'bar'}, {}).isChanged).toBe(true)
  })

  test('returns correct path', () => {
    expect(diffObject({}, {}, []).path).toStrictEqual([])
    expect(diffObject({bb: 'b'}, {aa: 'a'}, ['sub']).path).toStrictEqual(['sub'])
    expect(diffObject({aa: 'a'}, {bb: 'b'}, ['sub', {_key: 'key'}, 13]).path).toStrictEqual([
      'sub',
      {_key: 'key'},
      13
    ])
  })

  test('does not diff root-level fields expected to change', () => {
    const fromValue = {_rev: 'abc123', _updatedAt: '2017-02-02T13:37:00Z'}
    const toValue = {_rev: 'def456', _updatedAt: '2019-04-03T13:37:00Z'}
    expect(diffObject(fromValue, toValue)).toMatchObject({isChanged: false, fromValue, toValue})
  })

  test('returns empty fields object on nullish values', () => {
    expect(Object.keys(diffObject(null, undefined).fields)).toHaveLength(0)
  })

  test('handles nested arrays', () => {
    expect(diffObject({pets: []}, {pets: ['jara', 'kokos']})).toMatchObject({isChanged: true})
  })
})
