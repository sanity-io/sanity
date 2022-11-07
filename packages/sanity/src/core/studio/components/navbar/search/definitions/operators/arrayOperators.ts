import {FieldInputNumber} from '../../components/filters/filter/inputTypes/Number'
import {toJSON} from './operatorUtils'
import {defineSearchOperator, SearchOperatorParams} from './operatorTypes'

export const arrayOperators = {
  arrayCountEqual: defineSearchOperator({
    buttonLabel: 'has',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity is',
    type: 'arrayCountEqual',
  }),
  arrayCountGt: defineSearchOperator({
    buttonLabel: 'has >',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) > ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity more than (>)',
    type: 'arrayCountGt',
  }),
  arrayCountGte: defineSearchOperator({
    buttonLabel: 'has ≥',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) >= ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity more than (≥)',
    type: 'arrayCountGte',
  }),
  arrayCountLt: defineSearchOperator({
    buttonLabel: 'has <',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) < ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity less than (<)',
    type: 'arrayCountLt',
  }),
  arrayCountLte: defineSearchOperator({
    buttonLabel: 'has ≤',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) <= ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity less than (≤)',
    type: 'arrayCountLte',
  }),
  arrayCountNotEqual: defineSearchOperator({
    buttonLabel: 'does not have',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity is not',
    type: 'arrayCountNotEqual',
  }),
} as const
