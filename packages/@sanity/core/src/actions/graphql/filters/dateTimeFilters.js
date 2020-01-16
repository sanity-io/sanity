function createDateTimeFilters() {
  return {
    name: 'DatetimeFilter',
    kind: 'InputObject',
    fields: [
      {
        fieldName: 'eq',
        type: 'Datetime',
        description: 'All documents that are equal to given value.'
      },
      {
        fieldName: 'neq',
        type: 'Datetime',
        description: 'All documents that are not equal to given value.'
      },
      {
        fieldName: 'gt',
        type: 'Datetime',
        description: 'All documents are greater than given value'
      },
      {
        fieldName: 'gte',
        type: 'Datetime',
        description: 'All documents are greater than or equal to given value'
      },
      {
        fieldName: 'lt',
        type: 'Datetime',
        description: 'All documents are less than given value'
      },
      {
        fieldName: 'lte',
        type: 'Datetime',
        description: 'All documents are less than or equal to given value'
      }
    ]
  }
}

module.exports = createDateTimeFilters
