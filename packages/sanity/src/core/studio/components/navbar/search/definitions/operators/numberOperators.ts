import {SearchFilterNumberInput} from '../../components/filters/filter/inputs/number/Number'
import {SearchFilterNumberRangeInput} from '../../components/filters/filter/inputs/number/NumberRange'
import {GteIcon} from '../../components/filters/icons/GteIcon'
import {GtIcon} from '../../components/filters/icons/GtIcon'
import {LteIcon} from '../../components/filters/icons/LteIcon'
import {LtIcon} from '../../components/filters/icons/LtIcon'
import {OperatorNumberRangeValue} from './common'
import {defineSearchOperator, SearchOperatorInput} from './operatorTypes'
import {toJSON} from './operatorUtils'

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `yarn etl` fails with 'Unable to follow symbol' errors
export const numberOperators = {
  numberEqual: defineSearchOperator({
    nameKey: 'search.operator.number-equal.name',
    descriptionKey: 'search.operator.number-equal.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    type: 'numberEqual',
  }),
  numberGt: defineSearchOperator({
    nameKey: 'search.operator.number-gt.name',
    descriptionKey: 'search.operator.number-gt.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} > ${toJSON(value)}` : null,
    icon: GtIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    type: 'numberGt',
  }),
  numberGte: defineSearchOperator({
    nameKey: 'search.operator.number-gte.name',
    descriptionKey: 'search.operator.number-gte.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} >= ${toJSON(value)}` : null,
    icon: GteIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    type: 'numberGte',
  }),
  numberLt: defineSearchOperator({
    nameKey: 'search.operator.number-lt.name',
    descriptionKey: 'search.operator.number-lt.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} < ${toJSON(value)}` : null,
    icon: LtIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    type: 'numberLt',
  }),
  numberLte: defineSearchOperator({
    nameKey: 'search.operator.number-lte.name',
    descriptionKey: 'search.operator.number-lte.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} <= ${toJSON(value)}` : null,
    icon: LteIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    type: 'numberLte',
  }),
  numberNotEqual: defineSearchOperator({
    nameKey: 'search.operator.number-not-equal.name',
    descriptionKey: 'search.operator.number-not-equal.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    type: 'numberNotEqual',
  }),
  numberRange: defineSearchOperator({
    nameKey: 'search.operator.number-range.name',
    descriptionKey: 'search.operator.number-range.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value?.to) && Number.isFinite(value?.from) && fieldPath
        ? `${fieldPath} > ${toJSON(value?.from)} && ${fieldPath} < ${toJSON(value?.to)}`
        : '',
    initialValue: null,
    inputComponent: SearchFilterNumberRangeInput as SearchOperatorInput<OperatorNumberRangeValue>,
    type: 'numberRange',
  }),
}
