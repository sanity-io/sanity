const {upperFirst} = require('lodash')

function generateTypeQueries(types, filters, sortings) {
  const queries = []
  const queryable = types.filter(
    (type) =>
      type.name === 'Document' ||
      (type.type === 'Object' && type.interfaces && type.interfaces.includes('Document'))
  )

  const isSortable = (type) => sortings.some((sorting) => sorting.name === `${type.name}Sorting`)

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
    queries.push({
      fieldName: `all${upperFirst(type.name)}`,
      filter:
        type.name === 'Document'
          ? 'defined(_type)'
          : '_type == "'.concat(type.originalName || type.name, '"'),
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
        isSortable(type) && {
          name: 'sort',
          type: {
            kind: 'List',
            isNullable: true,
            children: {
              type: `${type.name}Sorting`,
              isNullable: false,
            },
          },
        },
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
      ].filter(Boolean),
    })
  })

  return queries
}

module.exports = generateTypeQueries
