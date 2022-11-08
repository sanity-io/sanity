import {FieldInputString} from '../../components/filters/filter/inputTypes/String'
import {toJSON} from './operatorUtils'
import {defineSearchOperator} from './operatorTypes'

export const portableTextOperators = {
  portableTextEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValue: (value) => value || null,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `pt::text(${fieldPath}) == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'is',
    type: 'portableTextEqual',
  }),
  portableTextMatches: defineSearchOperator({
    buttonLabel: 'contains',
    buttonValue: (value) => value || null,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `pt::text(${fieldPath}) match ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'contains',
    type: 'portableTextMatches',
  }),
  portableTextNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValue: (value) => value || null,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `pt::text(${fieldPath}) != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'is not',
    type: 'portableTextNotEqual',
  }),
  portableTextNotMatches: defineSearchOperator({
    buttonLabel: 'does not contain',
    buttonValue: (value) => value || null,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `!(pt::text(${fieldPath}) match ${toJSON(value)})` : null,
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'does not contain',
    type: 'portableTextNotMatches',
  }),
}
