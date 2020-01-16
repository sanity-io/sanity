function createIdFilters() {
  return {
    name: 'IDFilter',
    kind: 'InputObject',
    fields: [
      {
        fieldName: 'eq',
        type: 'ID',
        description: 'All documents that are equal to given value.'
      },
      {
        fieldName: 'neq',
        type: 'ID',
        description: 'All documents that are not equal to given value.'
      },
      {
        fieldName: 'matches',
        type: 'ID',
        description: 'All documents contain (match) the given word/words.'
      },
      {
        fieldName: 'in',
        kind: 'List',
        children: {
          type: 'ID',
          isNullable: false
        },
        description: 'All documents match one of the given values.'
      },
      {
        fieldName: 'nin',
        kind: 'List',
        children: {
          type: 'ID',
          isNullable: false
        },
        description: 'None of the values match any of the given values.'
      }
    ]
  }
}

module.exports = createIdFilters
