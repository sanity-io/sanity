import {FieldInputString} from '../../components/filters/filter/inputTypes/String'
import {toJSON} from './operatorUtils'
import {defineSearchOperator} from './operatorTypes'

export const stringOperators = {
  stringEqual: defineSearchOperator({
    buttonLabel: 'is',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'is',
    type: 'stringEqual',
  }),
  stringMatches: defineSearchOperator({
    buttonLabel: 'contains',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} match ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'contains',
    type: 'stringMatches',
  }),
  stringNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'is not',
    type: 'stringNotEqual',
  }),
  stringNotMatches: defineSearchOperator({
    buttonLabel: 'does not contain',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `!(${fieldPath} match ${toJSON(value)})` : null,
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'does not contain',
    type: 'stringNotMatches',
  }),
}
