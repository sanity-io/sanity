import {StringSchemaType} from '@sanity/types'
import {SelectInput} from '../../inputs/SelectInput'
import {StringInput} from '../../inputs/StringInput'
import {getOption} from './helpers'

export function resolveStringInput(type: StringSchemaType) {
  return getOption(type, 'list') ? SelectInput : StringInput
}
