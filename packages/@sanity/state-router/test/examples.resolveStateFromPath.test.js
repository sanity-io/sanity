import test from './_util/test'
import inspect from 'object-inspect'
import {router, examples} from './examples'
import resolveStateFromPath from '../src/resolveStateFromPath'

examples.forEach(([path, state]) => {
  test(`path ${path} resolves to state ${inspect(state)}`, t => {
    t.same(resolveStateFromPath(router, path), state)
  })
})
