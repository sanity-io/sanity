import pluralize from 'pluralize-esm'
import {startCase, upperFirst} from 'lodash'
import type {ConvertedType, ConvertedUnion, InputObjectType, QueryDefinition} from '../types'
import {isNonUnion} from '../helpers'

function pluralizeTypeName(name: string): string {
  const words = startCase(name).split(' ')
  const last = words[words.length - 1]
  // `pluralize` previously incorrectly cased the S to uppercase after numbers,
  // which we need to maintain for backwards compatibility
  const plural = pluralize(last.toLowerCase()).replace(/(\d)s$/g, '$1S')
  words[words.length - 1] = upperFirst(plural)
  return words.join('')
}

export function generateTypeQueries(
  types: (ConvertedType | ConvertedUnion)[],
  filters: InputObjectType[],
): QueryDefinition[] {
  const queries: QueryDefinition[] = []
  const queryable = types
    .filter(isNonUnion)
    .filter(
      (type) => type.type === 'Object' && type.interfaces && type.interfaces.includes('Document'),
    )

  // Single ID-based result lookup queries
  queryable.forEach((type) => {
    queries.push({
      fieldName: type.name,
      type: type.name,
      constraints: [
        {
          field: '_id',
          comparator: 'EQUALS',
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
    const filterName = `${type.name}Filter`
    const hasFilter = filters.find((filter) => filter.name === filterName)
    queries.push({
      fieldName: `all${pluralizeTypeName(type.name)}`,
      filter: `_type == "${type.originalName || type.name}"`,
      type: {
        kind: 'List',
        isNullable: false,
        children: {type: type.name, isNullable: false},
      },
      args: hasFilter
        ? [{name: 'where', type: filterName, isFieldFilter: true}, ...getLimitOffsetArgs()]
        : getLimitOffsetArgs(),
    })
  })

  return queries
}

function getLimitOffsetArgs(): QueryDefinition['args'] {
  return [
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
  ]
}
