import {NumberSchemaType} from '@sanity/types'
import {SelectInput} from '../../inputs/SelectInput'
import {NumberInput} from '../../inputs/NumberInput'
import {getOption} from './helpers'

export function resolveNumberInput(type: NumberSchemaType) {
  return getOption(type, 'list') ? SelectInput : NumberInput
}
