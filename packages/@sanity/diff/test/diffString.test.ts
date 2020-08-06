import {diffString} from '../src/calculate/diffString'

describe('diffString', () => {
  test('returns correct from/to value', () => {
    expect(diffString('from this', 'to this')).toMatchInlineSnapshot(`
      Object {
        "fromValue": "from this",
        "isChanged": true,
        "path": Array [],
        "segments": Array [
          Object {
            "text": "from",
            "type": "removed",
          },
          Object {
            "text": "to",
            "type": "added",
          },
          Object {
            "text": " this",
            "type": "unchanged",
          },
        ],
        "toValue": "to this",
        "type": "string",
      }
    `)
  })

  test('diff returns same segments array on each call', () => {
    const diffA = diffString('from this', 'to this')
    const diffB = diffString('from this', 'to this')

    // Same value on different diff instances
    expect(JSON.stringify(diffA)).toStrictEqual(JSON.stringify(diffB))

    // Same _instance_ of array on same diff instance
    expect(diffA.segments).toBe(diffA.segments)

    // Different _instance_ of array on different diff instances
    expect(diffA.segments).not.toBe(diffB.segments)
  })

  test('returns correct segment type on unchanged string', () => {
    expect(diffString('same', 'same').segments).toMatchInlineSnapshot(`
      Array [
        Object {
          "text": "same",
          "type": "unchanged",
        },
      ]
    `)
  })

  test('returns correct segment type on empty string', () => {
    expect(diffString('', '').segments).toMatchInlineSnapshot(`Array []`)
  })

  test('returns correct segment type on added string', () => {
    expect(diffString('start', 'start here').segments).toMatchInlineSnapshot(`
      Array [
        Object {
          "text": "start",
          "type": "unchanged",
        },
        Object {
          "text": " here",
          "type": "added",
        },
      ]
    `)
  })

  test('returns correct segment type on removed string', () => {
    expect(diffString('start here', 'here').segments).toMatchInlineSnapshot(`
      Array [
        Object {
          "text": "start ",
          "type": "removed",
        },
        Object {
          "text": "here",
          "type": "unchanged",
        },
      ]
    `)
  })

  test('returns correct segment type on changed string', () => {
    expect(diffString('start here', 'end here').segments).toMatchInlineSnapshot(`
      Array [
        Object {
          "text": "start",
          "type": "removed",
        },
        Object {
          "text": "end",
          "type": "added",
        },
        Object {
          "text": " here",
          "type": "unchanged",
        },
      ]
    `)
  })

  test('returns correct isChanged value', () => {
    expect(diffString('a', 'a').isChanged).toBe(false)
    expect(diffString('a', 'b').isChanged).toBe(true)
  })

  test('returns correct path', () => {
    expect(diffString('a', 'a', []).path).toStrictEqual([])
    expect(diffString('a', 'a', ['sub']).path).toStrictEqual(['sub'])
    expect(diffString('a', 'b', ['sub', {_key: 'key'}, 13]).path).toStrictEqual([
      'sub',
      {_key: 'key'},
      13
    ])
  })
})
