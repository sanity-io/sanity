import {test} from 'tap'
import {Patcher} from '../src/patch'
import {cloneDeep} from 'lodash'

// Test suites
import set from './patchExamples/set'
import setIfMissing from './patchExamples/setIfMissing'
import unset from './patchExamples/unset'
import diffMatchPatch from './patchExamples/diffMatchPatch'
import insert from './patchExamples/insert'
import incDec from './patchExamples/incDec'

const examples = [].concat(set, setIfMissing, unset, diffMatchPatch, insert, incDec)

examples.forEach(example => {
  test(example.name, tap => {
    const patcher = new Patcher(example.patch)
    const pristine = cloneDeep(example.before)
    const patched = patcher.apply(example.before)
    // Verify patch
    tap.same(patched, example.after, 'patch result must match example')
    // Verify immutability
    tap.same(pristine, example.before, 'original value must not be touched')

    tap.end()
  })
})
