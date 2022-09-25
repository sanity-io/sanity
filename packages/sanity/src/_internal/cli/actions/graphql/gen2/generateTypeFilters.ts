import type {ConvertedType, ConvertedUnion, InputObjectType} from '../types'
import {isNonUnion, isUnion} from '../helpers'
import {createBooleanFilters} from './filters/booleanFilters'
import {createDateFilters} from './filters/dateFilters'
import {createDateTimeFilters} from './filters/dateTimeFilters'
import {createDocumentFilters} from './filters/documentFilters'
import {createFloatFilters} from './filters/floatFilters'
import {createIdFilters} from './filters/idFilters'
import {createIntegerFilters} from './filters/integerFilters'
import {createStringFilters} from './filters/stringFilters'

const typeAliases: Record<string, string | undefined> = {
  Url: 'String',
  Text: 'String',
  Email: 'String',
}

type FilterCreator = () => InputObjectType

const filterCreators: Record<string, FilterCreator> = {
  ID: createIdFilters,
  String: createStringFilters,
  Float: createFloatFilters,
  Integer: createIntegerFilters,
  Boolean: createBooleanFilters,
  Datetime: createDateTimeFilters,
  Date: createDateFilters,
  Document: createDocumentFilters,
}

export function generateTypeFilters(types: (ConvertedType | ConvertedUnion)[]): InputObjectType[] {
  const builtInTypeKeys = Object.keys(filterCreators)
  const builtinTypeValues = Object.values(filterCreators)
  const objectTypes = types
    .filter(isNonUnion)
    .filter(
      (type) =>
        type.type === 'Object' &&
        !['Block', 'Span'].includes(type.name) &&
        !type.interfaces &&
        !builtInTypeKeys.includes(type.type)
    )

  const unionTypes = types.filter(isUnion).map((type) => type.name)
  const documentTypes = types
    .filter(isNonUnion)
    .filter(
      (type) => type.type === 'Object' && type.interfaces && type.interfaces.includes('Document')
    )

  const builtinTypeFilters = createBuiltinTypeFilters(builtinTypeValues)
  const objectTypeFilters = createObjectTypeFilters(objectTypes, {unionTypes})
  const documentTypeFilters = createDocumentTypeFilters(documentTypes, {unionTypes})

  return [...builtinTypeFilters, ...objectTypeFilters, ...documentTypeFilters]
}

function createBuiltinTypeFilters(builtinTypeValues: FilterCreator[]): InputObjectType[] {
  return builtinTypeValues.map((filterCreator) => filterCreator())
}

function createObjectTypeFilters(
  objectTypes: ConvertedType[],
  options: {unionTypes: string[]}
): InputObjectType[] {
  return objectTypes.map((objectType) => ({
    name: `${objectType.name}Filter`,
    kind: 'InputObject',
    fields: createFieldFilters(objectType, options),
  }))
}

function createDocumentTypeFilters(
  documentTypes: ConvertedType[],
  options: {unionTypes: string[]}
): InputObjectType[] {
  return documentTypes.map((documentType) => ({
    name: `${documentType.name}Filter`,
    kind: 'InputObject',
    fields: [...getDocumentFilters(), ...createFieldFilters(documentType, options)],
  }))
}

function createFieldFilters(objectType: ConvertedType, options: {unionTypes: string[]}) {
  const {unionTypes} = options
  return objectType.fields
    .filter(
      (field) => field.type !== 'JSON' && field.kind !== 'List' && !unionTypes.includes(field.type)
    )
    .map((field) => ({
      fieldName: field.fieldName,
      type: `${typeAliases[field.type] || field.type}Filter`,
      isReference: field.isReference,
    }))
}

function getDocumentFilters() {
  return [
    {
      fieldName: '_',
      type: 'DocumentFilter',
      description: 'Apply filters on document level',
    },
  ]
}
