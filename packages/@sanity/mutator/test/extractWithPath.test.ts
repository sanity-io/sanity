import {expect, test} from 'vitest'

import {extractWithPath} from '../src/jsonpath'

test('basic extraction', () => {
  expect(
    extractWithPath('..[_weak == true]._ref', {reference: {_ref: '123', _weak: true}}),
  ).toEqual([{path: ['reference', '_ref'], value: '123'}])
})

test('recursive descent does not leak matches between sibling branches', () => {
  expect(extractWithPath('a..deep', {a: [{deep: 1}], other: {deep: 2}})).toEqual([
    {path: ['a', 0, 'deep'], value: 1},
  ])
})

test('recursive descent after a nested path returns each match once', () => {
  const doc = {x: {y: [{v: 1}, {v: 2}]}}
  expect(extractWithPath('x.y[0]..v', doc)).toEqual([{path: ['x', 'y', 0, 'v'], value: 1}])
})
