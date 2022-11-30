import {typed} from '@sanity/types'
import {
  SearchButtonValueNumber,
  SearchButtonValueNumberRange,
} from '../../components/filters/common/ButtonValue'
import {SearchFilterNumberInput} from '../../components/filters/filter/inputs/number/Number'
import {SearchFilterNumberRangeInput} from '../../components/filters/filter/inputs/number/NumberRange'
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
    buttonValueComponent: SearchButtonValueNumber,
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    label: 'is',
    type: 'numberEqual',
  }),
  numberGt: defineSearchOperator({
    buttonLabel: '>',
    buttonValueComponent: SearchButtonValueNumber,
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} > ${toJSON(value)}` : null,
    icon: GtIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    label: 'greater than',
    type: 'numberGt',
  }),
  numberGte: defineSearchOperator({
    buttonLabel: '≥',
    buttonValueComponent: SearchButtonValueNumber,
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} >= ${toJSON(value)}` : null,
    icon: GteIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    label: 'greater than or equal to',
    type: 'numberGte',
  }),
  numberLt: defineSearchOperator({
    buttonLabel: '<',
    buttonValueComponent: SearchButtonValueNumber,
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} < ${toJSON(value)}` : null,
    icon: LtIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    label: 'less than',
    type: 'numberLt',
  }),
  numberLte: defineSearchOperator({
    buttonLabel: '≤',
    buttonValueComponent: SearchButtonValueNumber,
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} <= ${toJSON(value)}` : null,
    icon: LteIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    label: 'less than or equal to',
    type: 'numberLte',
  }),
  numberNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: SearchButtonValueNumber,
    fn: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    label: 'is not',
    type: 'numberNotEqual',
  }),
  numberRange: defineSearchOperator({
    buttonLabel: 'is between',
    buttonValueComponent: SearchButtonValueNumberRange,
    fn: ({fieldPath, value}) =>
      Number.isFinite(value?.max) && Number.isFinite(value?.min) && fieldPath
        ? `${fieldPath} > ${toJSON(value?.min)} && ${fieldPath} < ${toJSON(value?.max)}`
        : '',
    initialValue: typed<OperatorNumberRangeValue>({max: null, min: null}),
    inputComponent: SearchFilterNumberRangeInput,
    label: 'is between',
    type: 'numberRange',
  }),
}
