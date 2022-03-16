import inspect from 'object-inspect'
import {resolvePathFromState} from '../src/resolvePathFromState'
import {router, examples} from './examples'

examples.forEach(([path, state]) => {
  test(`state ${inspect(state)} produces path ${path}`, () => {
    expect(resolvePathFromState(router, state)).toEqual(path)
  })
})
