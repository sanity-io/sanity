import {extractWithPath} from '../src/jsonpath'
import {expect, test} from 'vitest'

test('basic extraction', () => {
  expect(
    extractWithPath('..[_weak == true]._ref', {reference: {_ref: '123', _weak: true}}),
  ).toEqual([{path: ['reference', '_ref'], value: '123'}])
})
