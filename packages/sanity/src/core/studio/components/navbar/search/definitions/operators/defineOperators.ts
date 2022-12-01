import {defineSearchOperator} from './operatorTypes'

export const definedOperators = {
  defined: defineSearchOperator({
    buttonLabel: 'not empty',
    groqFilter: ({fieldPath}) => (fieldPath ? `defined(${fieldPath})` : null),
    label: 'not empty',
    type: 'defined',
  }),
  notDefined: defineSearchOperator({
    buttonLabel: 'empty',
    groqFilter: ({fieldPath}) => (fieldPath ? `!defined(${fieldPath})` : null),
    label: 'empty',
    type: 'notDefined',
  }),
}
