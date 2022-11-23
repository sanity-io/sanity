import {typed} from '@sanity/types'
import {
  ButtonValueNumber,
  ButtonValueNumberRange,
} from '../../components/filters/common/ButtonValue'
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
    buttonValueComponent: ButtonValueNumber,
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'is',
    type: 'numberEqual',
  }),
  numberGt: defineSearchOperator({
    buttonLabel: '>',
    buttonValueComponent: ButtonValueNumber,
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} > ${toJSON(value)}` : null,
    icon: GtIcon,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'greater than',
    type: 'numberGt',
  }),
  numberGte: defineSearchOperator({
    buttonLabel: '≥',
    buttonValueComponent: ButtonValueNumber,
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} >= ${toJSON(value)}` : null,
    icon: GteIcon,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'greater than or equal to',
    type: 'numberGte',
  }),
  numberLt: defineSearchOperator({
    buttonLabel: '<',
    buttonValueComponent: ButtonValueNumber,
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} < ${toJSON(value)}` : null,
    icon: LtIcon,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'less than',
    type: 'numberLt',
  }),
  numberLte: defineSearchOperator({
    buttonLabel: '≤',
    buttonValueComponent: ButtonValueNumber,
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} <= ${toJSON(value)}` : null,
    icon: LteIcon,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'less than or equal to',
    type: 'numberLte',
  }),
  numberNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: ButtonValueNumber,
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'is not',
    type: 'numberNotEqual',
  }),
  numberRange: defineSearchOperator({
    buttonLabel: 'is between',
    buttonValueComponent: ButtonValueNumberRange,
    fn: ({fieldPath, value}) =>
      Number.isFinite(value?.max) && Number.isFinite(value?.min) && fieldPath
        ? `${fieldPath} > ${toJSON(value?.min)} && ${fieldPath} < ${toJSON(value?.max)}`
        : '',
    initialValue: typed<OperatorNumberRangeValue>({max: null, min: null}),
    inputComponent: FieldInputNumberRange,
    label: 'is between',
    type: 'numberRange',
  }),
}
