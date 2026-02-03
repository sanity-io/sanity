import {SelectInput} from '../../inputs/SelectInput'
import {StringInput} from '../../inputs/StringInput/StringInput'
import {getOption} from './helpers'
import {type StringSchemaType} from '@sanity/types'

export function resolveStringInput(type: StringSchemaType) {
  return getOption(type, 'list') ? SelectInput : StringInput
}
