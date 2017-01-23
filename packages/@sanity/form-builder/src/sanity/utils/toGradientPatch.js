import {arrayToJSONMatchPath} from '@sanity/mutator'
import assert from 'assert'

export default function toGradientPatch(patch) {
  const matchPath = arrayToJSONMatchPath(patch.path)
  if (patch.type === 'insert') {
    const {position, items} = patch
    return {
      insert: {
        [position]: matchPath,
        items: items
      }
    }
  }

  if (patch.type === 'unset') {
    return {
      unset: [matchPath]
    }
  }

  assert(patch.type, `Missing patch type in patch ${JSON.stringify(patch)}`)
  return {
    [patch.type]: {
      [matchPath]: patch.value
    }
  }
}
