import {type NumberSchemaType} from '@sanity/types'

import {NumberInput} from '../../inputs/NumberInput'
import {SelectInput} from '../../inputs/SelectInput'
import {getOption} from './helpers'

export function resolveNumberInput(type: NumberSchemaType) {
  return getOption(type, 'list') ? SelectInput : NumberInput
}
