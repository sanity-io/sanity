import {diffBoolean} from '../src/calculate/diffBoolean'

describe('diffBoolean', () => {
  test('returns correct from/to value', () => {
    expect(diffBoolean(true, false)).toMatchInlineSnapshot(`
      Object {
        "fromValue": true,
        "isChanged": true,
        "path": Array [],
        "toValue": false,
        "type": "boolean",
      }
    `)
  })

  test('handles null/undefined values', () => {
    expect(diffBoolean(true, null)).toMatchObject({
      type: 'boolean',
      fromValue: true,
      toValue: null,
      isChanged: true
    })

    expect(diffBoolean(false, undefined)).toMatchObject({
      type: 'boolean',
      fromValue: false,
      toValue: undefined,
      isChanged: true
    })

    expect(diffBoolean(null, undefined)).toMatchObject({
      type: 'boolean',
      fromValue: null,
      toValue: undefined,
      isChanged: true
    })
  })

  test('returns correct isChanged value', () => {
    expect(diffBoolean(true, true).isChanged).toBe(false)
    expect(diffBoolean(true, false).isChanged).toBe(true)
  })

  test('returns correct path', () => {
    expect(diffBoolean(true, true, []).path).toStrictEqual([])
    expect(diffBoolean(true, false, ['sub']).path).toStrictEqual(['sub'])
    expect(diffBoolean(true, false, ['sub', {_key: 'key'}, 13]).path).toStrictEqual([
      'sub',
      {_key: 'key'},
      13
    ])
  })
})
