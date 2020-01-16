function createFloatFilters() {
  return {
    name: 'FloatFilter',
    kind: 'InputObject',
    fields: [
      {
        fieldName: 'eq',
        type: 'Float',
        description: 'All documents that are equal to given value.'
      },
      {
        fieldName: 'neq',
        type: 'Float',
        description: 'All documents that are not equal to given value.'
      },
      {
        fieldName: 'gt',
        type: 'Float',
        description: 'All documents are greater than given value'
      },
      {
        fieldName: 'gte',
        type: 'Float',
        description: 'All documents are greater than or equal to given value'
      },
      {
        fieldName: 'lt',
        type: 'Float',
        description: 'All documents are less than given value'
      },
      {
        fieldName: 'lte',
        type: 'Float',
        description: 'All documents are less than or equal to given value'
      }
    ]
  }
}

module.exports = createFloatFilters
