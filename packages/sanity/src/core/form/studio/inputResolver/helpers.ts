import {isArraySchemaType, SchemaType} from '@sanity/types'
import {get} from 'lodash'

export function getOption(type: SchemaType, optionName: string) {
  return get(type.options, optionName)
}

const PSEUDO_OBJECTS = ['array', 'file', 'image', 'reference', 'slug']
const HIDDEN_FIELDS = ['asset', 'crop', 'hotspot', '_ref', '_weak']
const NO_LEVEL_LAYOUTS = ['tags']
const NO_LEVEL_TYPES = ['slug']

export function getTypeChain(type: SchemaType | undefined, visited: Set<SchemaType>): SchemaType[] {
  if (!type) return []
  if (visited.has(type)) return []

  visited.add(type)

  const next = type.type ? getTypeChain(type.type, visited) : []
  return [type, ...next]
}

export function getFieldLevel(schemaType: SchemaType, currentLevel: number) {
  return isArraySchemaType(schemaType)
    ? getArrayFieldLevel(schemaType, currentLevel)
    : getObjectFieldLevel(schemaType, currentLevel)
}

function getObjectFieldLevel(schemaType: SchemaType, currentLevel: number): number {
  const {type, options} = schemaType
  const typeIfRelevant = asType(type, PSEUDO_OBJECTS)
  const fields = schemaType?.jsonType === 'object' ? schemaType.fields : undefined

  const typeName = typeIfRelevant?.name || ''

  if (NO_LEVEL_TYPES.includes(typeName)) {
    return 0
  }

  const isPseudoObject = PSEUDO_OBJECTS.includes(typeName)
  const hasVisibleFields = (fields?.filter((f) => !HIDDEN_FIELDS.includes(f.name)).length ?? 0) > 0
  const hasListOptions = (options?.list?.length ?? 0) > 0

  if (hasVisibleFields || hasListOptions || !isPseudoObject) {
    return currentLevel
  }

  return 0
}

function getArrayFieldLevel(schemaType: SchemaType, currentLevel: number): number {
  const {options} = schemaType

  const hasListOptions = (options?.list || [])?.length > 0
  const isNoLevelLayout = NO_LEVEL_LAYOUTS.includes(options?.layout || '')

  if (hasListOptions && !isNoLevelLayout) {
    return currentLevel
  }

  return 0
}

function asType(
  schemaType: SchemaType | undefined,
  asOneOfTypes: string[]
): SchemaType | undefined {
  if (schemaType?.name && asOneOfTypes.includes(schemaType?.name)) {
    return schemaType
  }
  if (!schemaType) {
    return undefined
  }
  return asType(schemaType.type, asOneOfTypes)
}
