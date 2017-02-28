import {once} from 'lodash'
import ReferenceSearchableSelect from '../inputs/ReferenceSearchableSelect'
import ReferenceSelect from '../inputs/ReferenceSelect'
import ReferenceBrowser from '../inputs/ReferenceBrowser'

// eslint-disable-next-line no-console
const warnNoSearchYet = once(() => console.warn('Reference browser does not yet support search'))

export default function resolveReference(type) {
  const options = type.options || {}
  if (options.inputType === 'select') {
    return options.searchable
      ? ReferenceSearchableSelect
      : ReferenceSelect
  }

  if (options.inputType === 'browser') {
    if (options.searchable) {
      warnNoSearchYet()
    }
    return ReferenceBrowser
  }

  return ReferenceSearchableSelect
}
