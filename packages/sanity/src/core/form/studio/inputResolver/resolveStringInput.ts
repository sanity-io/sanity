import {type StringSchemaType} from '@sanity/types'

import {SelectInput} from '../../inputs/SelectInput'
import {StringInput} from '../../inputs/StringInput/StringInput'
import {IncomingReferencesInput} from '../inputs/incomingReferencesInput/IncomingReferencesInput'
import {getOption} from './helpers'

export function resolveStringInput(type: StringSchemaType) {
  // @ts-expect-error - TODO: Temporal - Add the decoration type to the schema definition.
  if (type.__internal_isDecoration) {
    return IncomingReferencesInput
  }
  return getOption(type, 'list') ? SelectInput : StringInput
}
