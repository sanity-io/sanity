import type {InputObjectType} from '../../types'

export function createIntegerFilters(): InputObjectType {
  return {
    name: 'IntFilter',
    kind: 'InputObject',
    isConstraintFilter: true,
    fields: [
      {
        fieldName: 'eq',
        type: 'Int',
        description: 'Checks if the value is equal to the given input.',
      },
      {
        fieldName: 'neq',
        type: 'Int',
        description: 'Checks if the value is not equal to the given input.',
      },
      {
        fieldName: 'gt',
        type: 'Int',
        description: 'Checks if the value is greater than the given input.',
      },
      {
        fieldName: 'gte',
        type: 'Int',
        description: 'Checks if the value is greater than or equal to the given input.',
      },
      {
        fieldName: 'lt',
        type: 'Int',
        description: 'Checks if the value is lesser than the given input.',
      },
      {
        fieldName: 'lte',
        type: 'Int',
        description: 'Checks if the value is lesser than or equal to the given input.',
      },
      {
        fieldName: 'is_defined',
        type: 'Boolean',
        description: 'Checks if the value is defined.',
      },
    ],
  }
}
