import {at, inc, insert, set, setIfMissing} from '@sanity/mutate'
import {applyPatches} from '@sanity/mutate/_unstable_apply'

const document = {
  _id: 'foo',
  _type: 'ok',
  counter: 99999,
  arr: [1, 3, 4],
  objects: [
    {_key: 'first', title: 'first'},
    {_key: 'third', title: 'third'},
  ],
} as const

const patches = [
  at('arr', insert([2], 'before', 1)),
  at('arr', insert([5], 'after', -1)),
  at('objects', insert([{_key: 'second', title: 'second'}], 'after', 0)),
  at('foo', set('ok')),
  at('bar', set('something')),
  at('counter', inc(1)),
  at('x', setIfMissing({_type: 'test'})),
  at('x.foo', setIfMissing('bar')),
  at('objects[_key=="second"].title', set('Updated')),
] as const

const result = applyPatches(patches, document)

const third = result.objects[2]
// console.log(third)
