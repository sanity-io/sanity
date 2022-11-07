import {typed} from '@sanity/types'
import {FieldInputNumber} from '../../components/filters/filter/inputTypes/Number'
import {FieldInputNumberRange} from '../../components/filters/filter/inputTypes/NumberRange'
import {toJSON} from './operatorUtils'
import {defineSearchOperator} from './operatorTypes'

export interface OperatorNumberRangeValue {
  max: number | null
  min: number | null
}

export const numberOperators = {
  numberEqual: defineSearchOperator({
    buttonLabel: 'is',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'is',
    type: 'numberEqual',
  }),
  numberGt: defineSearchOperator({
    buttonLabel: '>',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} > ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'greater than (>)',
    type: 'numberGt',
  }),
  numberGte: defineSearchOperator({
    buttonLabel: '≥',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} >= ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'greater than or equal to (≥)',
    type: 'numberGte',
  }),
  numberLt: defineSearchOperator({
    buttonLabel: '<',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} < ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'less than (<)',
    type: 'numberLt',
  }),
  numberLte: defineSearchOperator({
    buttonLabel: '≤',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} <= ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'less than or equal to (≤)',
    type: 'numberLte',
  }),
  numberNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'is not',
    type: 'numberNotEqual',
  }),
  numberRange: defineSearchOperator({
    buttonLabel: 'is between',
    inputComponent: FieldInputNumberRange,
    initialValue: typed<OperatorNumberRangeValue>({max: null, min: null}),
    fn: ({fieldPath, value}) =>
      value?.max && value?.min && fieldPath
        ? `${fieldPath} > ${toJSON(value.min)} && ${fieldPath} < ${toJSON(value.max)}`
        : '',
    label: 'is between',
    type: 'numberRange',
  }),
} as const
