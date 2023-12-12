import {upperFirst} from 'lodash'
import {isDocumentType, isUnion} from '../helpers'
import type {
  ApiCustomizationOptions,
  ConvertedType,
  ConvertedUnion,
  InputObjectType,
  QueryDefinition,
} from '../types'
import {getFilterFieldName} from './utils'

export function generateTypeQueries(
  types: (ConvertedType | ConvertedUnion)[],
  sortings: InputObjectType[],
  options?: ApiCustomizationOptions,
): QueryDefinition[] {
  const {filterSuffix} = options || {}
  const queries: QueryDefinition[] = []
  const documentTypes = types.filter(isDocumentType)

  const documentTypeNames = documentTypes.map((docType) =>
    JSON.stringify(docType.originalName || docType.name),
  )
  const documentsFilter = `_type in [${documentTypeNames.join(', ')}]`

  const documentInterface = types.find((type) => type.name === 'Document')
  if (!documentInterface || isUnion(documentInterface)) {
    throw new Error('Failed to find document interface')
  }

  const queryable = [...documentTypes, documentInterface]
  const isSortable = (type: ConvertedType) =>
    sortings.some((sorting) => sorting.name === `${type.name}Sorting`)

  // Single ID-based result lookup queries
  queryable.forEach((type) => {
    queries.push({
      fieldName: type.name,
      type: type.name,
      constraints: [
        {
          field: '_id',
          comparator: 'eq',
          value: {kind: 'argumentValue', argName: 'id'},
        },
      ],
      args: [
        {
          name: 'id',
          description: `${type.name} document ID`,
          type: 'ID',
          isNullable: false,
        },
      ],
    })
  })

  // Fetch all of type
  queryable.forEach((type) => {
    const sorting: QueryDefinition['args'] = []
    if (isSortable(type)) {
      sorting.push({
        name: 'sort',
        type: {
          kind: 'List',
          isNullable: true,
          children: {
            type: `${type.name}Sorting`,
            isNullable: false,
          },
        },
      })
    }

    queries.push({
      fieldName: `all${upperFirst(type.name)}`,
      filter:
        type.name === 'Document' && type.kind === 'Interface'
          ? documentsFilter
          : `_type == ${JSON.stringify(type.originalName || type.name)}`,
      type: {
        kind: 'List',
        isNullable: false,
        children: {type: type.name, isNullable: false},
      },
      args: [
        {
          name: 'where',
          type: getFilterFieldName(type.name, filterSuffix),
          isFieldFilter: true,
        },
        ...sorting,
        {
          name: 'limit',
          type: 'Int',
          description: 'Max documents to return',
          isFieldFilter: false,
        },
        {
          name: 'offset',
          type: 'Int',
          description: 'Offset at which to start returning documents from',
          isFieldFilter: false,
        },
      ],
    })
  })

  return queries
}
