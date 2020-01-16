function createDateFilters() {
  return {
    name: 'DateFilter',
    kind: 'InputObject',
    fields: [
      {
        fieldName: 'eq',
        type: 'Date',
        description: 'All documents that are equal to given value.'
      },
      {
        fieldName: 'neq',
        type: 'Date',
        description: 'All documents that are not equal to given value.'
      },
      {
        fieldName: 'gt',
        type: 'Date',
        description: 'All documents are greater than given value'
      },
      {
        fieldName: 'gte',
        type: 'Date',
        description: 'All documents are greater than or equal to given value'
      },
      {
        fieldName: 'lt',
        type: 'Date',
        description: 'All documents are less than given value'
      },
      {
        fieldName: 'lte',
        type: 'Date',
        description: 'All documents are less than or equal to given value'
      }
    ]
  }
}

module.exports = createDateFilters
