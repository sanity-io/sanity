const pluralize = require('pluralize')
const {startCase, upperFirst} = require('lodash')

function pluralizeTypeName(name) {
  const words = startCase(name).split(' ')
  const last = words[words.length - 1]
  const plural = pluralize(last.toLowerCase())
  words[words.length - 1] = upperFirst(plural)
  return words.join('')
}

function generateTypeQueries(types, filters, sortings) {
  const queries = []
  const queryable = types.filter(
    type => type.type === 'Object' && type.interfaces && type.interfaces.includes('Document')
  )

  const isSortable = type => sortings.some(sorting => sorting.name === `${type.name}Sorting`)

  // Single ID-based result lookup queries
  queryable.forEach(type => {
    queries.push({
      fieldName: type.name,
      type: type.name,
      constraints: [
        {
          field: '_id',
          comparator: 'EQUALS',
          value: {kind: 'argumentValue', argName: 'id'}
        }
      ],
      args: [
        {
          name: 'id',
          description: `${type.name} document ID`,
          type: 'ID',
          isNullable: false
        }
      ]
    })
  })

  // Fetch all of type
  queryable.forEach(type => {
    queries.push({
      fieldName: `all${pluralizeTypeName(type.name)}`,
      filter: `_type == "${type.originalName || type.name}"`,
      type: {
        kind: 'List',
        isNullable: false,
        children: {type: type.name, isNullable: false}
      },
      args: [
        {
          name: 'where',
          type: `${type.name}Filter`,
          isFieldFilter: true
        },
        isSortable(type) && {
          name: 'sort',
          type: {
            kind: 'List',
            isNullable: true,
            children: {
              type: `${type.name}Sorting`,
              isNullable: false
            }
          }
        },
        {
          name: 'limit',
          type: 'Int',
          description: 'Max documents to return',
          isFieldFilter: false
        },
        {
          name: 'offset',
          type: 'Int',
          description: 'Offset at which to start returning documents from',
          isFieldFilter: false
        }
      ].filter(Boolean)
    })
  })

  return queries
}

module.exports = generateTypeQueries
