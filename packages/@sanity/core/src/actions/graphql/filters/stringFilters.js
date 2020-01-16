function createStringFilters() {
  return {
    name: 'StringFilter',
    kind: 'InputObject',
    fields: [
      {
        fieldName: 'eq',
        type: 'String',
        description: 'All documents that are equal to given value.'
      },
      {
        fieldName: 'neq',
        type: 'String',
        description: 'All documents that are not equal to given value.'
      },
      {
        fieldName: 'matches',
        type: 'String',
        description: 'All documents contain (match) the given word/words.'
      },
      {
        fieldName: 'in',
        kind: 'List',
        children: {
          type: 'String',
          isNullable: false
        },
        description: 'All documents match one of the given values.'
      },
      {
        fieldName: 'nin',
        kind: 'List',
        children: {
          type: 'String',
          isNullable: false
        },
        description: 'None of the values match any of the given values.'
      }
    ]
  }
}

module.exports = createStringFilters
