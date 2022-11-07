import {defineSearchOperator} from './operatorTypes'

export const definedOperators = {
  defined: defineSearchOperator({
    buttonLabel: 'not empty',
    fn: ({fieldPath}) => (fieldPath ? `defined(${fieldPath})` : null),
    label: 'not empty',
    type: 'defined',
  }),
  notDefined: defineSearchOperator({
    buttonLabel: 'empty',
    fn: ({fieldPath}) => (fieldPath ? `!defined(${fieldPath})` : null),
    label: 'empty',
    type: 'notDefined',
  }),
} as const
