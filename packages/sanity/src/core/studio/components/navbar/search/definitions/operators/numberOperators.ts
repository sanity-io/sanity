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
import {defineSearchOperator, SearchOperatorButtonValue, SearchOperatorInput} from './operatorTypes'
import {toJSON} from './operatorUtils'

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `yarn etl` fails with 'Unable to follow symbol' errors
export const numberOperators = {
  numberEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueNumber as SearchOperatorButtonValue<number>,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    label: 'is',
    type: 'numberEqual',
  }),
  numberGt: defineSearchOperator({
    buttonLabel: '>',
    buttonValueComponent: SearchButtonValueNumber as SearchOperatorButtonValue<number>,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} > ${toJSON(value)}` : null,
    icon: GtIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    label: 'greater than',
    type: 'numberGt',
  }),
  numberGte: defineSearchOperator({
    buttonLabel: '≥',
    buttonValueComponent: SearchButtonValueNumber as SearchOperatorButtonValue<number>,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} >= ${toJSON(value)}` : null,
    icon: GteIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    label: 'greater than or equal to',
    type: 'numberGte',
  }),
  numberLt: defineSearchOperator({
    buttonLabel: '<',
    buttonValueComponent: SearchButtonValueNumber as SearchOperatorButtonValue<number>,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} < ${toJSON(value)}` : null,
    icon: LtIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    label: 'less than',
    type: 'numberLt',
  }),
  numberLte: defineSearchOperator({
    buttonLabel: '≤',
    buttonValueComponent: SearchButtonValueNumber as SearchOperatorButtonValue<number>,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} <= ${toJSON(value)}` : null,
    icon: LteIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    label: 'less than or equal to',
    type: 'numberLte',
  }),
  numberNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: SearchButtonValueNumber as SearchOperatorButtonValue<number>,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    label: 'is not',
    type: 'numberNotEqual',
  }),
  numberRange: defineSearchOperator({
    buttonLabel: 'is between',
    buttonValueComponent:
      SearchButtonValueNumberRange as SearchOperatorButtonValue<OperatorNumberRangeValue>,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value?.max) && Number.isFinite(value?.min) && fieldPath
        ? `${fieldPath} > ${toJSON(value?.min)} && ${fieldPath} < ${toJSON(value?.max)}`
        : '',
    initialValue: null,
    inputComponent: SearchFilterNumberRangeInput as SearchOperatorInput<OperatorNumberRangeValue>,
    label: 'is between',
    type: 'numberRange',
  }),
}
