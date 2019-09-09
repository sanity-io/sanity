import inspect from 'object-inspect'
import {router, examples} from './examples'
import resolveStateFromPath from '../src/resolveStateFromPath'

examples.forEach(([path, state]) => {
  test(`path ${path} resolves to state ${inspect(state)}`, () => {
    expect(resolveStateFromPath(router, path)).toEqual(state)
  })
})
