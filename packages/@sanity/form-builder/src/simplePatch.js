import {Patcher} from '@sanity/mutator'
import toGradientPatch from './sanity/utils/toGradientPatch'
import arrify from 'arrify'

export default function applyPatch(value, patches) {
  return arrify(patches)
    .map(toGradientPatch)
    .map(patch => new Patcher(patch))
    .reduce((next, patch) => patch.applyViaAccessor(next), value)
}
