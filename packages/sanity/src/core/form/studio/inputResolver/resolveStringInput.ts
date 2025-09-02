import {type StringSchemaType} from '@sanity/types'

import {SelectInput} from '../../inputs/SelectInput'
import {StringInput} from '../../inputs/StringInput/StringInput'
import {getOption} from './helpers'

export function resolveStringInput(type: StringSchemaType) {
  // xxx diffing for list inputs?
  return getOption(type, 'list') ? SelectInput : StringInput
}
