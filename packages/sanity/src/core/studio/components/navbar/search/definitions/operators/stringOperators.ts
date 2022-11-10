import {FieldInputString} from '../../components/filters/filter/inputTypes/String'
import {FieldInputStringList} from '../../components/filters/filter/inputTypes/StringList'
import {defineSearchOperator} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const stringOperators = {
  stringEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValue: (value) => value || null,
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'is',
    type: 'stringEqual',
  }),
  stringListEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValue: (value) => value || null,
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputStringList,
    label: 'is',
    type: 'stringListEqual',
  }),
  stringListNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValue: (value) => value || null,
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputStringList,
    label: 'is not',
    type: 'stringListNotEqual',
  }),
  stringMatches: defineSearchOperator({
    buttonLabel: 'contains',
    buttonValue: (value) => value || null,
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} match ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'contains',
    type: 'stringMatches',
  }),
  stringNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValue: (value) => value || null,
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'is not',
    type: 'stringNotEqual',
  }),
  stringNotMatches: defineSearchOperator({
    buttonLabel: 'does not contain',
    buttonValue: (value) => value || null,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `!(${fieldPath} match ${toJSON(value)})` : null,
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'does not contain',
    type: 'stringNotMatches',
  }),
}
