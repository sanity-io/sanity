import {expect, test} from 'vitest'

import {type Layer, LAYERS, parseHidden, serializeHidden} from './layers'

test('a pristine param hides nothing', () => {
  expect(parseHidden('')).toEqual(new Set())
})

test('round-trips a hidden set', () => {
  const hidden = new Set<Layer>(['band', 'baseline'])
  expect(parseHidden(serializeHidden(hidden))).toEqual(hidden)
})

// All layers visible must serialize to '' so useUrlState drops the param
// entirely rather than leaving `?layers=` on every shared link
test('everything visible serializes to the empty param', () => {
  expect(serializeHidden(new Set())).toBe('')
})

test('serialization order is stable regardless of insertion order', () => {
  const a = serializeHidden(new Set<Layer>(['baseline', 'band']))
  const b = serializeHidden(new Set<Layer>(['band', 'baseline']))
  expect(a).toBe(b)
})

// A hand-edited or stale URL must not produce a phantom layer
test('unknown tokens are ignored', () => {
  expect(parseHidden('-nope,-band,garbage')).toEqual(new Set(['band']))
})

test('tolerates tokens with and without the minus prefix', () => {
  expect(parseHidden('band')).toEqual(new Set(['band']))
  expect(parseHidden('-band')).toEqual(new Set(['band']))
})

test('every layer is individually representable', () => {
  for (const layer of LAYERS) {
    expect(parseHidden(serializeHidden(new Set([layer])))).toEqual(new Set([layer]))
  }
})
