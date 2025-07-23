import {type ReferenceSchemaType} from '@sanity/types'
import {once} from 'lodash'

import {StudioReferenceInput} from '../inputs/reference/StudioReferenceInput'

const warnInputTypeNotSupported = once(() =>
  console.warn('The option "inputType" on references is removed.'),
)
const warnSearchableOptionNotSupported = once(() =>
  console.warn('The option "searchable" on references has been removed.'),
)

export function resolveReferenceInput(type: ReferenceSchemaType) {
  const options = type.options || {}
  if ('inputType' in options) {
    warnInputTypeNotSupported()
  }
  if ('searchable' in options) {
    warnSearchableOptionNotSupported()
  }
  return StudioReferenceInput
}
