import {typed} from '@sanity/types'
import {FieldInputNumber} from '../../components/filters/filter/inputTypes/Number'
import {FieldInputNumberRange} from '../../components/filters/filter/inputTypes/NumberRange'
import {GteIcon} from '../../components/filters/icons/GteIcon'
import {GtIcon} from '../../components/filters/icons/GtIcon'
import {LteIcon} from '../../components/filters/icons/LteIcon'
import {LtIcon} from '../../components/filters/icons/LtIcon'
import {OperatorNumberRangeValue} from './common'
import {defineSearchOperator} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const numberOperators = {
  numberEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValue: (value) => (Number.isFinite(value) ? value : null),
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'is',
    type: 'numberEqual',
  }),
  numberGt: defineSearchOperator({
    buttonLabel: '>',
    buttonValue: (value) => (Number.isFinite(value) ? value : null),
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} > ${toJSON(value)}` : null,
    inputComponent: FieldInputNumber,
    icon: GtIcon,
    initialValue: null,
    label: 'greater than',
    type: 'numberGt',
  }),
  numberGte: defineSearchOperator({
    buttonLabel: '≥',
    buttonValue: (value) => (Number.isFinite(value) ? value : null),
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} >= ${toJSON(value)}` : null,
    icon: GteIcon,
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'greater than or equal to',
    type: 'numberGte',
  }),
  numberLt: defineSearchOperator({
    buttonLabel: '<',
    buttonValue: (value) => (Number.isFinite(value) ? value : null),
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} < ${toJSON(value)}` : null,
    icon: LtIcon,
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'less than',
    type: 'numberLt',
  }),
  numberLte: defineSearchOperator({
    buttonLabel: '≤',
    buttonValue: (value) => (Number.isFinite(value) ? value : null),
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} <= ${toJSON(value)}` : null,
    icon: LteIcon,
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'less than or equal to',
    type: 'numberLte',
  }),
  numberNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValue: (value) => (Number.isFinite(value) ? value : null),
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null,
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'is not',
    type: 'numberNotEqual',
  }),
  numberRange: defineSearchOperator({
    buttonLabel: 'is between',
    buttonValue: (value) =>
      Number.isFinite(value?.max) && Number.isFinite(value?.min)
        ? `${value.min} → ${value.max}`
        : null,
    inputComponent: FieldInputNumberRange,
    initialValue: typed<OperatorNumberRangeValue>({max: null, min: null}),
    fn: ({fieldPath, value}) =>
      Number.isFinite(value?.max) && Number.isFinite(value?.min) && fieldPath
        ? `${fieldPath} > ${toJSON(value?.min)} && ${fieldPath} < ${toJSON(value?.max)}`
        : '',
    label: 'is between',
    type: 'numberRange',
  }),
}
