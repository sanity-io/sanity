import {ReferenceSchemaType} from '@sanity/types'
import {once} from 'lodash'
import {StudioReferenceInput} from '../inputs/reference/StudioReferenceInput'

/* eslint-disable no-console */
const warnInputTypeNotSupported = once(() =>
  console.warn('The option "inputType" on references is removed.'),
)
const warnSearchableOptionNotSupported = once(() =>
  console.warn('The option "searchable" on references has been removed.'),
)

/* eslint-enable no-console */

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
