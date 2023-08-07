import type {InputObjectType} from '../../types'

export function createFloatFilters(): InputObjectType {
  return {
    name: 'FloatFilter',
    kind: 'InputObject',
    isConstraintFilter: true,
    fields: [
      {
        fieldName: 'eq',
        type: 'Float',
        description: 'Checks if the value is equal to the given input.',
      },
      {
        fieldName: 'neq',
        type: 'Float',
        description: 'Checks if the value is not equal to the given input.',
      },
      {
        fieldName: 'gt',
        type: 'Float',
        description: 'Checks if the value is greater than the given input.',
      },
      {
        fieldName: 'gte',
        type: 'Float',
        description: 'Checks if the value is greater than or equal to the given input.',
      },
      {
        fieldName: 'lt',
        type: 'Float',
        description: 'Checks if the value is lesser than the given input.',
      },
      {
        fieldName: 'lte',
        type: 'Float',
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
