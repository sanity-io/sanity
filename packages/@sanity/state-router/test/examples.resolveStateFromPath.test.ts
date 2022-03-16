import inspect from 'object-inspect'
import {resolveStateFromPath} from '../src/resolveStateFromPath'
import {router, examples} from './examples'

examples.forEach(([path, state]) => {
  test(`path ${path} resolves to state ${inspect(state)}`, () => {
    expect(resolveStateFromPath(router, path)).toEqual(state)
  })
})
