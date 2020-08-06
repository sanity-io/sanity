import {diffNumber} from '../src/calculate/diffNumber'

describe('diffNumber', () => {
  test('returns correct from/to value', () => {
    expect(diffNumber(1, 2)).toMatchInlineSnapshot(`
      Object {
        "fromValue": 1,
        "isChanged": true,
        "path": Array [],
        "toValue": 2,
        "type": "number",
      }
    `)
  })

  test('handles null/undefined values', () => {
    expect(diffNumber(1, null)).toMatchObject({
      type: 'number',
      fromValue: 1,
      toValue: null,
      isChanged: true
    })

    expect(diffNumber(2, undefined)).toMatchObject({
      type: 'number',
      fromValue: 2,
      toValue: undefined,
      isChanged: true
    })

    expect(diffNumber(null, undefined)).toMatchObject({
      type: 'number',
      fromValue: null,
      toValue: undefined,
      isChanged: true
    })
  })

  test('returns correct isChanged value', () => {
    expect(diffNumber(1, 1).isChanged).toBe(false)
    expect(diffNumber(1, 2).isChanged).toBe(true)
  })

  test('returns correct path', () => {
    expect(diffNumber(1, 1, []).path).toStrictEqual([])
    expect(diffNumber(1, 2, ['sub']).path).toStrictEqual(['sub'])
    expect(diffNumber(1, 3, ['sub', {_key: 'key'}, 13]).path).toStrictEqual([
      'sub',
      {_key: 'key'},
      13
    ])
  })
})
