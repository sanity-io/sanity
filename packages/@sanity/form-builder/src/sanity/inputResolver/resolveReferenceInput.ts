import {once} from 'lodash'
import ReferenceInput from '../inputs/reference/SanityReferenceInput'

/* eslint-disable no-console */
const warnInputTypeNotSupported = once(() =>
  console.warn('The option "inputType" on references is removed.')
)
const warnSearchableOptionNotSupported = once(() =>
  console.warn('The option "searchable" on references has been removed.')
)

/* eslint-enable no-console */

export default function resolveReferenceInput(type) {
  const options = type.options || {}
  if (options.inputType) {
    warnInputTypeNotSupported()
  }
  if ('searchable' in options) {
    warnSearchableOptionNotSupported()
  }
  return ReferenceInput
}
