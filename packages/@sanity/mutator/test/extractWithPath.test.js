import {test} from 'tap'
import {extractWithPath} from '../src/jsonpath'

test('basic extraction', tap => {
  tap.same(extractWithPath('..[_weak == true]._ref', {reference: {_ref: '123', _weak: true}}), [
    {path: ['reference', '_ref'], value: '123'}
  ])
  tap.end()
})
