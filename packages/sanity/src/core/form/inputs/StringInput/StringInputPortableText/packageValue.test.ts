import {packageValue} from './packageValue'
import {expect, it} from 'vitest'

it('produces a Portable Text value with the primitive value stored at the expected path', () => {
  expect(packageValue('a')).toMatchInlineSnapshot(`
    [
      {
        "_key": "root",
        "_type": "block",
        "children": [
          {
            "_key": "root",
            "_type": "span",
            "text": "a",
          },
        ],
      },
    ]
  `)
})

it('gracefully handles `undefined` input value', () => {
  expect(packageValue(undefined)).toMatchInlineSnapshot(`
    [
      {
        "_key": "root",
        "_type": "block",
        "children": [
          {
            "_key": "root",
            "_type": "span",
            "text": "",
          },
        ],
      },
    ]
  `)
})
