import {diffInput, wrap} from '@sanity/diff'
import {expect, it} from 'vitest'

import {type ProvenanceDiffAnnotation} from '../../../../store/types/diff'
import {computeStringDiffRangeDecorations} from './computeStringDiffRangeDecorations'

const provenanceAnnotation: ProvenanceDiffAnnotation = {
  provenance: {
    bundle: 'published',
  },
}

it('produces an array of range decorations for the provided diff', () => {
  const diff = diffInput(wrap('a', provenanceAnnotation), wrap('b', provenanceAnnotation))

  expect(computeStringDiffRangeDecorations({diff})).toMatchInlineSnapshot(`
    [
      {
        "component": [Function],
        "payload": {
          "action": "merged",
          "id": "removed.a.added.b",
        },
        "selection": {
          "anchor": {
            "offset": 0,
            "path": [
              {
                "_key": "root",
              },
              "children",
              {
                "_key": "root",
              },
            ],
          },
          "focus": {
            "offset": 1,
            "path": [
              {
                "_key": "root",
              },
              "children",
              {
                "_key": "root",
              },
            ],
          },
        },
      },
    ]
  `)
})

it('merges overlapping range decorations', () => {
  const diff = diffInput(wrap('a b', provenanceAnnotation), wrap('a c', provenanceAnnotation))

  expect(computeStringDiffRangeDecorations({diff})).toMatchInlineSnapshot(`
    [
      {
        "component": [Function],
        "payload": {
          "action": "merged",
          "id": "removed.b.added.c",
        },
        "selection": {
          "anchor": {
            "offset": 2,
            "path": [
              {
                "_key": "root",
              },
              "children",
              {
                "_key": "root",
              },
            ],
          },
          "focus": {
            "offset": 3,
            "path": [
              {
                "_key": "root",
              },
              "children",
              {
                "_key": "root",
              },
            ],
          },
        },
      },
    ]
  `)
})

it('applies the provided `mapPayload` function', () => {
  const diff = diffInput(wrap('a', provenanceAnnotation), wrap('b', provenanceAnnotation))

  const rangeDecorations = computeStringDiffRangeDecorations({
    diff,
    mapPayload: (payload) => ({
      ...payload,
      extraKey: 'extraValue',
    }),
  })

  expect(rangeDecorations).toSatisfy(
    (value) =>
      Array.isArray(value) &&
      value.map(({payload}) => payload).every(({extraKey}) => extraKey === 'extraValue'),
  )
})
