import toGradientPatch from '../../sanity/utils/toGradientPatch'
import arrify from 'arrify'
import {Patcher, ImmutableAccessor} from '@sanity/mutator'

const FAKE_KEY = 'fakeRoot'
const FAKE_ID = 'fakeID'

export default function applySanityPatches(value, patches) {
  const gradientPatches = arrify(patches)
    .map(patch => ({
      ...patch,
      path: [FAKE_KEY, ...(patch.path || [])]
    }))
    .map(toGradientPatch)
    .map(gradientPatch => ({
      id: FAKE_ID,
      ...gradientPatch
    }))

  let nextValue = wrapSlateValueInFakeDocument(value)
  gradientPatches.forEach(gPatch => {
    nextValue = new Patcher(gPatch).applyViaAccessor(nextValue)
  })
  return nextValue.getAttribute(FAKE_KEY)
}

function wrapSlateValueInFakeDocument(value) {
  return {
    containerType() {
      return 'object'
    },
    hasAttribute(key) {
      return key === FAKE_KEY
    },
    getAttribute(key) {
      if (key == '_id') {
        return new ImmutableAccessor(FAKE_ID)
      }
      if (key == FAKE_KEY) {
        return value
      }
      return null
    },
    setAttributeAccessor(key, accessor) {
      if (key != FAKE_KEY) {
        throw new Error(`Unable to set key ${key} in this mock document container`)
      }
      return wrapSlateValueInFakeDocument(accessor)
    }
  }
}
