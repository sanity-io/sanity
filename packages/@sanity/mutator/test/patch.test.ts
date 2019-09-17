import {test} from 'tap'
import {cloneDeep} from 'lodash'
import {Patcher} from '../src/patch'

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
    // Fake some id's in there
    example.before._id = 'a'
    if (Array.isArray(example.patch)) {
      example.patch.forEach(patch => (patch.id = 'a'))
    } else {
      example.patch.id = 'a'
    }

    const patcher = new Patcher(example.patch)
    const pristine = cloneDeep(example.before)
    const patched = patcher.apply(example.before)

    // Don't care about ids in result
    delete patched._id
    delete pristine._id
    delete example.before._id

    // Verify patch
    tap.same(patched, example.after, 'patch result must match example')
    // Verify immutability
    tap.same(pristine, example.before, 'original value must not be touched')

    tap.end()
  })
})
