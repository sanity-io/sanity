import type {InputObjectType} from '../../types'

export function createStringFilters(): InputObjectType {
  return {
    name: 'StringFilter',
    kind: 'InputObject',
    isConstraintFilter: true,
    fields: [
      {
        fieldName: 'eq',
        type: 'String',
        description: 'Checks if the value is equal to the given input.',
      },
      {
        fieldName: 'neq',
        type: 'String',
        description: 'Checks if the value is not equal to the given input.',
      },
      {
        fieldName: 'matches',
        type: 'String',
        description: 'Checks if the value matches the given word/words.',
      },
      {
        fieldName: 'in',
        kind: 'List',
        children: {
          type: 'String',
          isNullable: false,
        },
        description: 'Checks if the value is equal to one of the given values.',
      },
      {
        fieldName: 'nin',
        kind: 'List',
        children: {
          type: 'String',
          isNullable: false,
        },
        description: 'Checks if the value is not equal to one of the given values.',
      },
    ],
  }
}
