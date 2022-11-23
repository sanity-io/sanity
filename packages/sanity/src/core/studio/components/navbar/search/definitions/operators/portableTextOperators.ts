import {ButtonValueString} from '../../components/filters/common/ButtonValue'
import {FieldInputString} from '../../components/filters/filter/inputTypes/String'
import {defineSearchOperator} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const portableTextOperators = {
  portableTextEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: ButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `pt::text(${fieldPath}) == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'is',
    type: 'portableTextEqual',
  }),
  portableTextMatches: defineSearchOperator({
    buttonLabel: 'contains',
    buttonValueComponent: ButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `pt::text(${fieldPath}) match ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'contains',
    type: 'portableTextMatches',
  }),
  portableTextNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: ButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `pt::text(${fieldPath}) != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'is not',
    type: 'portableTextNotEqual',
  }),
  portableTextNotMatches: defineSearchOperator({
    buttonLabel: 'does not contain',
    buttonValueComponent: ButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `!(pt::text(${fieldPath}) match ${toJSON(value)})` : null,
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'does not contain',
    type: 'portableTextNotMatches',
  }),
}
