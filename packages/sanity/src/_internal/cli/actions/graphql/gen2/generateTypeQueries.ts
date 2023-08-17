import {upperFirst} from 'lodash'
import {isDocumentType} from '../helpers'
import type {ConvertedType, ConvertedUnion, InputObjectType, QueryDefinition} from '../types'

export function generateTypeQueries(
  types: (ConvertedType | ConvertedUnion)[],
  sortings: InputObjectType[],
): QueryDefinition[] {
  const queries: QueryDefinition[] = []
  const queryable = types.filter(isDocumentType)
  const isSortable = (type: ConvertedType) =>
    sortings.some((sorting) => sorting.name === `${type.name}Sorting`)

  // A document of any type
  queries.push({
    fieldName: 'Document',
    type: 'Document',
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
        description: 'Document ID',
        type: 'ID',
        isNullable: false,
      },
    ],
  })

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
      filter: `_type == "${type.originalName || type.name}"`,
      type: {
        kind: 'List',
        isNullable: false,
        children: {type: type.name, isNullable: false},
      },
      args: [
        {
          name: 'where',
          type: `${type.name}Filter`,
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
