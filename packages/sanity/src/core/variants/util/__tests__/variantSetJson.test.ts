import {describe, expect, it} from 'vitest'

import {parseVariantSetJson, serializeVariantSet} from '../variantSetJson'

describe('serializeVariantSet', () => {
  it('serializes name and complete dimensions to pretty JSON', () => {
    const json = serializeVariantSet({
      name: '  Regional launch  ',
      dimensions: [
        {key: 'market', values: ['uk', 'us']},
        {key: 'segment', values: ['loyal']},
      ],
    })

    expect(JSON.parse(json)).toEqual({
      name: 'Regional launch',
      dimensions: [
        {key: 'market', values: ['uk', 'us']},
        {key: 'segment', values: ['loyal']},
      ],
    })
  })

  it('drops incomplete dimensions', () => {
    const json = serializeVariantSet({
      name: 'X',
      dimensions: [
        {key: 'market', values: ['uk']},
        {key: '', values: ['ignored']},
        {key: 'segment', values: []},
      ],
    })

    expect(JSON.parse(json).dimensions).toEqual([{key: 'market', values: ['uk']}])
  })
})

describe('parseVariantSetJson', () => {
  it('round-trips the serialized shape', () => {
    const input = {name: 'Regional launch', dimensions: [{key: 'market', values: ['uk', 'us']}]}
    const result = parseVariantSetJson(JSON.stringify(input))

    expect(result).toEqual({ok: true, name: 'Regional launch', dimensions: input.dimensions})
  })

  it('accepts a bare key/value map with array or comma-string values', () => {
    const result = parseVariantSetJson('{"market": ["uk", "us"], "segment": "loyal, new"}')

    expect(result).toEqual({
      ok: true,
      name: '',
      dimensions: [
        {key: 'market', values: ['uk', 'us']},
        {key: 'segment', values: ['loyal', 'new']},
      ],
    })
  })

  it('reports invalid JSON', () => {
    expect(parseVariantSetJson('{not json')).toEqual({ok: false, error: 'invalid-json'})
  })

  it('reports an unusable shape', () => {
    expect(parseVariantSetJson('{"dimensions": [{"key": 1}]}')).toEqual({
      ok: false,
      error: 'invalid-shape',
    })
  })

  it('reports when there are no usable dimensions', () => {
    expect(parseVariantSetJson('{"name": "empty", "dimensions": []}')).toEqual({
      ok: false,
      error: 'no-dimensions',
    })
  })

  it('de-duplicates imported values', () => {
    const result = parseVariantSetJson('{"market": ["uk", "uk", "us"]}')
    expect(result).toEqual({
      ok: true,
      name: '',
      dimensions: [{key: 'market', values: ['uk', 'us']}],
    })
  })
})
