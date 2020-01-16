function createIntegerFilters() {
  return {
    name: 'IntFilter',
    kind: 'InputObject',
    fields: [
      {
        fieldName: 'eq',
        type: 'Int',
        description: 'All documents that are equal to given value.'
      },
      {
        fieldName: 'neq',
        type: 'Int',
        description: 'All documents that are not equal to given value.'
      },
      {
        fieldName: 'gt',
        type: 'Int',
        description: 'All documents are greater than given value'
      },
      {
        fieldName: 'gte',
        type: 'Int',
        description: 'All documents are greater than or equal to given value'
      },
      {
        fieldName: 'lt',
        type: 'Int',
        description: 'All documents are less than given value'
      },
      {
        fieldName: 'lte',
        type: 'Int',
        description: 'All documents are less than or equal to given value'
      }
    ]
  }
}

module.exports = createIntegerFilters
