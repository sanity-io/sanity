import type {InputObjectType} from '../../types'

export function createIdFilters(): InputObjectType {
  return {
    name: 'IDFilter',
    kind: 'InputObject',
    isConstraintFilter: true,
    fields: [
      {
        fieldName: 'eq',
        type: 'ID',
        description: 'Checks if the value is equal to the given input.',
      },
      {
        fieldName: 'neq',
        type: 'ID',
        description: 'Checks if the value is not equal to the given input.',
      },
      {
        fieldName: 'matches',
        type: 'ID',
        description: 'Checks if the value matches the given word/words.',
      },
      {
        fieldName: 'in',
        kind: 'List',
        children: {
          type: 'ID',
          isNullable: false,
        },
        description: 'Checks if the value is equal to one of the given values.',
      },
      {
        fieldName: 'nin',
        kind: 'List',
        children: {
          type: 'ID',
          isNullable: false,
        },
        description: 'Checks if the value is not equal to one of the given values.',
      },
    ],
  }
}
