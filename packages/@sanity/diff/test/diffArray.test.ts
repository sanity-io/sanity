import {diffArray} from '../src/calculate/diffArray'

describe('diffArray', () => {
  describe('primitive/mixed values', () => {
    test('short-circuits on referential identity', () => {
      const arr = ['foo']
      expect(diffArray(arr, arr).isChanged).toBe(false)
    })

    test('handles equal arrays', () => {
      expect(diffArray([1, 2], [1, 2])).toMatchInlineSnapshot(`
        Object {
          "fromValue": Array [
            1,
            2,
          ],
          "isChanged": false,
          "items": Array [],
          "path": Array [],
          "toValue": Array [
            1,
            2,
          ],
          "type": "array",
        }
      `)
    })

    test('handles all types', () => {
      expect(
        diffArray(
          [1, 'z', {_key: 'zing', val: 'yes'}, false, 9],
          [2, 'x', {_key: 'zing', val: 'no'}, true, '9']
        )
      ).toMatchInlineSnapshot(`
        Object {
          "fromValue": Array [
            1,
            "z",
            Object {
              "_key": "zing",
              "val": "yes",
            },
            false,
            9,
          ],
          "isChanged": true,
          "items": Array [
            Object {
              "fromValue": 1,
              "isChanged": true,
              "path": Array [
                0,
              ],
              "toValue": 2,
              "type": "number",
            },
            Object {
              "fromValue": "z",
              "isChanged": true,
              "path": Array [
                1,
              ],
              "segments": Array [
                Object {
                  "text": "z",
                  "type": "removed",
                },
                Object {
                  "text": "x",
                  "type": "added",
                },
              ],
              "toValue": "x",
              "type": "string",
            },
            Object {
              "fields": Object {
                "val": Object {
                  "fromValue": "yes",
                  "isChanged": true,
                  "path": Array [
                    2,
                    "val",
                  ],
                  "segments": Array [
                    Object {
                      "text": "yes",
                      "type": "removed",
                    },
                    Object {
                      "text": "no",
                      "type": "added",
                    },
                  ],
                  "toValue": "no",
                  "type": "string",
                },
              },
              "fromValue": Object {
                "_key": "zing",
                "val": "yes",
              },
              "isChanged": true,
              "path": Array [
                2,
              ],
              "toValue": Object {
                "_key": "zing",
                "val": "no",
              },
              "type": "object",
            },
            Object {
              "fromValue": false,
              "isChanged": true,
              "path": Array [
                3,
              ],
              "toValue": true,
              "type": "boolean",
            },
            Object {
              "fromType": "number",
              "fromValue": 9,
              "isChanged": true,
              "path": Array [
                4,
              ],
              "toType": "string",
              "toValue": "9",
              "type": "typeChange",
            },
          ],
          "path": Array [],
          "toValue": Array [
            2,
            "x",
            Object {
              "_key": "zing",
              "val": "no",
            },
            true,
            "9",
          ],
          "type": "array",
        }
      `)
    })
  })

  describe('not uniquely keyed objects', () => {
    test('uses array indexes', () => {
      expect(
        diffArray(
          [
            {_key: 'a', val: 1},
            {_key: 'b', val: 2}
          ],
          [
            {_key: 'a', val: 3},
            {_key: 'a', val: 4}
          ]
        )
      ).toMatchInlineSnapshot(`
        Object {
          "fromValue": Array [
            Object {
              "_key": "a",
              "val": 1,
            },
            Object {
              "_key": "b",
              "val": 2,
            },
          ],
          "isChanged": true,
          "items": Array [
            Object {
              "fields": Object {
                "val": Object {
                  "fromValue": 1,
                  "isChanged": true,
                  "path": Array [
                    0,
                    "val",
                  ],
                  "toValue": 3,
                  "type": "number",
                },
              },
              "fromValue": Object {
                "_key": "a",
                "val": 1,
              },
              "isChanged": true,
              "path": Array [
                0,
              ],
              "toValue": Object {
                "_key": "a",
                "val": 3,
              },
              "type": "object",
            },
            Object {
              "fields": Object {
                "_key": Object {
                  "fromValue": "b",
                  "isChanged": true,
                  "path": Array [
                    1,
                    "_key",
                  ],
                  "segments": Array [
                    Object {
                      "text": "b",
                      "type": "removed",
                    },
                    Object {
                      "text": "a",
                      "type": "added",
                    },
                  ],
                  "toValue": "a",
                  "type": "string",
                },
                "val": Object {
                  "fromValue": 2,
                  "isChanged": true,
                  "path": Array [
                    1,
                    "val",
                  ],
                  "toValue": 4,
                  "type": "number",
                },
              },
              "fromValue": Object {
                "_key": "b",
                "val": 2,
              },
              "isChanged": true,
              "path": Array [
                1,
              ],
              "toValue": Object {
                "_key": "a",
                "val": 4,
              },
              "type": "object",
            },
          ],
          "path": Array [],
          "toValue": Array [
            Object {
              "_key": "a",
              "val": 3,
            },
            Object {
              "_key": "a",
              "val": 4,
            },
          ],
          "type": "array",
        }
      `)
    })
  })

  describe('uniquely keyed objects', () => {
    test('uses object keys', () => {
      expect(
        diffArray(
          [
            {_key: 'a', val: 1},
            {_key: 'b', val: 2},
            {_key: 'c', val: 3}
          ],
          [
            {_key: 'a', val: 4},
            {_key: 'b', val: 5},
            {_key: 'c', val: 3}
          ]
        )
      ).toMatchInlineSnapshot(`
        Object {
          "fromValue": Array [
            Object {
              "_key": "a",
              "val": 1,
            },
            Object {
              "_key": "b",
              "val": 2,
            },
            Object {
              "_key": "c",
              "val": 3,
            },
          ],
          "isChanged": true,
          "items": Array [
            Object {
              "fields": Object {
                "val": Object {
                  "fromValue": 1,
                  "isChanged": true,
                  "path": Array [
                    Object {
                      "_key": "a",
                    },
                    "val",
                  ],
                  "toValue": 4,
                  "type": "number",
                },
              },
              "fromValue": Object {
                "_key": "a",
                "val": 1,
              },
              "isChanged": true,
              "path": Array [
                Object {
                  "_key": "a",
                },
              ],
              "toValue": Object {
                "_key": "a",
                "val": 4,
              },
              "type": "object",
            },
            Object {
              "fields": Object {
                "val": Object {
                  "fromValue": 2,
                  "isChanged": true,
                  "path": Array [
                    Object {
                      "_key": "b",
                    },
                    "val",
                  ],
                  "toValue": 5,
                  "type": "number",
                },
              },
              "fromValue": Object {
                "_key": "b",
                "val": 2,
              },
              "isChanged": true,
              "path": Array [
                Object {
                  "_key": "b",
                },
              ],
              "toValue": Object {
                "_key": "b",
                "val": 5,
              },
              "type": "object",
            },
          ],
          "path": Array [],
          "toValue": Array [
            Object {
              "_key": "a",
              "val": 4,
            },
            Object {
              "_key": "b",
              "val": 5,
            },
            Object {
              "_key": "c",
              "val": 3,
            },
          ],
          "type": "array",
        }
      `)
    })
  })
})
