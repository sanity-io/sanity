import {NumberInput} from '../../inputs/NumberInput/NumberInput'
import {SelectInput} from '../../inputs/SelectInput'
import {getOption} from './helpers'
import {type NumberSchemaType} from '@sanity/types'

export function resolveNumberInput(type: NumberSchemaType) {
  return getOption(type, 'list') ? SelectInput : NumberInput
}
