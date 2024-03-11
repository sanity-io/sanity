import {applyPatches, parsePatch} from '@sanity/diff-match-patch'

import {type DiffMatchPatchOp} from '../../../mutations/operations/types'

export function diffMatchPatch<
  O extends DiffMatchPatchOp,
  CurrentValue extends string,
>(op: O, currentValue: CurrentValue) {
  if (typeof currentValue !== 'string') {
    throw new TypeError('Cannot apply "diffMatchPatch()" on non-string value')
  }

  return applyPatches(parsePatch(op.value), currentValue)[0]
}
