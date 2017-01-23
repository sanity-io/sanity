import {Selection} from 'slate'

export default function deleteRange(state, patch) {
  return state
    .transform()
    .deleteAtRange(Selection.create(patch.range))
    .apply()
}
