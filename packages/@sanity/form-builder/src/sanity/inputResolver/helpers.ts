import {SchemaType} from '@sanity/types'
import {get} from 'lodash'

export function getOption(type: SchemaType, optionName: string) {
  return get(type.options, optionName)
}
