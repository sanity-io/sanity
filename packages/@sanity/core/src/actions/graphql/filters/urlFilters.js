function createUrlFilters() {
  return {
    name: 'UrlFilter',
    kind: 'InputObject',
    fields: [
      {
        fieldName: 'eq',
        type: 'Url',
        description: 'Checks if the value is equal to the given input.'
      },
      {
        fieldName: 'neq',
        type: 'Url',
        description: 'Checks if the value is not equal to the given input.'
      },
      {
        fieldName: 'matches',
        type: 'Url',
        description: 'Checks if the value matches the given word/words.'
      },
      {
        fieldName: 'in',
        kind: 'List',
        children: {
          type: 'Url',
          isNullable: false
        },
        description: 'Checks if the value is equal to one of the given values.'
      },
      {
        fieldName: 'nin',
        kind: 'List',
        children: {
          type: 'Url',
          isNullable: false
        },
        description: 'Checks if the value is not equal to one of the given values.'
      }
    ]
  }
}

module.exports = createUrlFilters
