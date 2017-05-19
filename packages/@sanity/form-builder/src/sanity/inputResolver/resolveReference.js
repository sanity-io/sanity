import {once} from 'lodash'
import ReferenceInput from '../inputs/ReferenceInput'
import ReferenceSelect from '../inputs/ReferenceSelect'
import ReferenceBrowser from '../inputs/ReferenceBrowser'

// eslint-disable-next-line no-console
const warnNoSearchYet = once(() => console.warn('Reference browser does not yet support search'))

export default function resolveReference(type) {
  const options = type.options || {}
  if (options.inputType === 'select' && options.searchable === false) {
    return ReferenceSelect
  }

  if (options.inputType === 'browser') {
    if (options.searchable) {
      warnNoSearchYet()
    }
    return ReferenceBrowser
  }

  return ReferenceInput
}
