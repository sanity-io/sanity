import {ObjectSchemaType, SchemaType} from '@sanity/types'
import {get} from 'lodash'
import {ArrayFieldProps} from '../../types'

export function getOption(type: SchemaType, optionName: string) {
  return get(type.options, optionName)
}

const PSEUDO_OBJECTS = ['array', 'file', 'image', 'reference']
const HIDDEN_FIELDS = ['asset', 'crop', 'hotspot', '_ref', '_weak']
const NO_LEVEL_LAYOUTS = ['tags']
const NO_LEVEL_TYPES = ['slug']

type PartialObjectSchema = Pick<ObjectSchemaType, 'name' | 'options'> & {
  type?: PartialObjectSchema
  fields?: {name: string}[]
}

export interface PartialObjectFieldProps {
  schemaType: PartialObjectSchema
  level: number
}

export function getObjectFieldLevel(field: PartialObjectFieldProps): number {
  const {type, fields, options} = field.schemaType
  const rootType = getRootType(type)
  const fieldType = rootType?.name || ''

  if (NO_LEVEL_TYPES.includes(fieldType)) {
    return 0
  }

  const isPseudoObject = PSEUDO_OBJECTS.includes(fieldType)
  const hasVisibleFields = (fields?.filter((f) => !HIDDEN_FIELDS.includes(f.name)).length ?? 0) > 0
  const hasListOptions = (options?.list?.length ?? 0) > 0

  if (hasVisibleFields || hasListOptions || !isPseudoObject) {
    return field.level
  }

  return 0
}

export function getArrayFieldLevel(field: ArrayFieldProps): number {
  const {options} = field.schemaType

  const hasListOptions = (options?.list || [])?.length > 0
  const isNoLevelLayout = NO_LEVEL_LAYOUTS.includes(options?.layout || '')

  if (hasListOptions && !isNoLevelLayout) {
    return field.level
  }

  return 0
}

function getRootType(schemaType?: PartialObjectSchema): PartialObjectSchema | undefined {
  if (!schemaType?.type) {
    return schemaType
  }
  return getRootType(schemaType.type)
}
