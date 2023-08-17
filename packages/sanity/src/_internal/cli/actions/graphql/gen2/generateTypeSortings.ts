import {isDocumentType, isNonUnion} from '../helpers'
import type {ConvertedEnum, ConvertedType, ConvertedUnion, InputObjectType} from '../types'

const builtInTypes = [
  'Boolean',
  'Date',
  'Datetime',
  'Email',
  'Float',
  'ID',
  'Integer',
  'String',
  'Text',
  'Url',
]

const builtInSortingEnum: ConvertedEnum = {
  name: 'SortOrder',
  kind: 'Enum',
  values: [
    {
      name: 'ASC',
      description: 'Sorts on the value in ascending order.',
      value: 1,
    },
    {
      name: 'DESC',
      description: 'Sorts on the value in descending order.',
      value: 2,
    },
  ],
}

export function generateTypeSortings(
  types: (ConvertedType | ConvertedUnion)[],
): (InputObjectType | ConvertedEnum)[] {
  const objectTypes = types.filter(isNonUnion).filter(
    (type) =>
      type.type === 'Object' &&
      !['Block', 'Span'].includes(type.name) && // TODO: What do we do with blocks?
      !type.interfaces &&
      !builtInTypes.includes(type.name),
  )

  const documentTypes = types.filter(isDocumentType)

  const hasFields = (type: InputObjectType) => type.fields.length > 0

  const objectTypeSortings = createObjectTypeSortings(objectTypes)
  const documentTypeSortings = createDocumentTypeSortings(documentTypes)
  const allSortings = [...objectTypeSortings, ...documentTypeSortings].filter(hasFields)

  return [...allSortings, builtInSortingEnum]
}

function createObjectTypeSortings(objectTypes: ConvertedType[]): InputObjectType[] {
  return objectTypes.map((objectType) => ({
    name: `${objectType.name}Sorting`,
    kind: 'InputObject',
    fields: objectType.fields
      .filter((field) => field.type !== 'JSON' && field.kind !== 'List')
      .filter((field) => !field.isReference)
      .map((field) => ({
        fieldName: field.fieldName,
        type: builtInTypes.includes(field.type) ? builtInSortingEnum.name : `${field.type}Sorting`,
      })),
  }))
}

function createDocumentTypeSortings(documentTypes: ConvertedType[]): InputObjectType[] {
  return documentTypes.map((documentType) => ({
    name: `${documentType.name}Sorting`,
    kind: 'InputObject',
    fields: documentType.fields
      .filter((field) => field.type !== 'JSON' && field.kind !== 'List')
      .filter((field) => !field.isReference)
      .map((field) => ({
        fieldName: field.fieldName,
        type: builtInTypes.includes(field.type) ? builtInSortingEnum.name : `${field.type}Sorting`,
      })),
  }))
}
