import {type ReferenceValue} from '@sanity/types'
import {
  SearchButtonValueNumberCount,
  SearchButtonValueNumberCountRange,
  SearchButtonValueReference,
  SearchButtonValueString,
} from '../../components/filters/common/ButtonValue'
import {SearchFilterNumberInput} from '../../components/filters/filter/inputs/number/Number'
import {SearchFilterNumberRangeInput} from '../../components/filters/filter/inputs/number/NumberRange'
import {SearchFilterReferenceInput} from '../../components/filters/filter/inputs/reference/Reference'
import {SearchFilterStringListInput} from '../../components/filters/filter/inputs/string/StringList'
import {GteIcon} from '../../components/filters/icons/GteIcon'
import {GtIcon} from '../../components/filters/icons/GtIcon'
import {LteIcon} from '../../components/filters/icons/LteIcon'
import {LtIcon} from '../../components/filters/icons/LtIcon'
import {OperatorNumberRangeValue} from './common'
import {defineSearchOperator, SearchOperatorButtonValue, SearchOperatorInput} from './operatorTypes'
import {toJSON} from './operatorUtils'

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `yarn etl` fails with 'Unable to follow symbol' errors
export const arrayOperators = {
  arrayCountEqual: defineSearchOperator({
    buttonLabel: 'has',
    buttonValueComponent: SearchButtonValueNumberCount as SearchOperatorButtonValue<number>,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    label: 'quantity is',
    type: 'arrayCountEqual',
  }),
  arrayCountGt: defineSearchOperator({
    buttonLabel: 'has >',
    buttonValueComponent: SearchButtonValueNumberCount as SearchOperatorButtonValue<number>,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) > ${toJSON(value)}` : null,
    icon: GtIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    label: 'quantity greater than',
    type: 'arrayCountGt',
  }),
  arrayCountGte: defineSearchOperator({
    buttonLabel: 'has ≥',
    buttonValueComponent: SearchButtonValueNumberCount as SearchOperatorButtonValue<number>,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) >= ${toJSON(value)}` : null,
    icon: GteIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    label: 'quantity greater than or equal to',
    type: 'arrayCountGte',
  }),
  arrayCountLt: defineSearchOperator({
    buttonLabel: 'has <',
    buttonValueComponent: SearchButtonValueNumberCount as SearchOperatorButtonValue<number>,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) < ${toJSON(value)}` : null,
    icon: LtIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    label: 'quantity less than',
    type: 'arrayCountLt',
  }),
  arrayCountLte: defineSearchOperator({
    buttonLabel: 'has ≤',
    buttonValueComponent: SearchButtonValueNumberCount as SearchOperatorButtonValue<number>,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) <= ${toJSON(value)}` : null,
    icon: LteIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    label: 'quantity less than or equal to',
    type: 'arrayCountLte',
  }),
  arrayCountNotEqual: defineSearchOperator({
    buttonLabel: 'does not have',
    buttonValueComponent: SearchButtonValueNumberCount as SearchOperatorButtonValue<number>,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    label: 'quantity is not',
    type: 'arrayCountNotEqual',
  }),
  arrayCountRange: defineSearchOperator({
    buttonLabel: 'has between',
    buttonValueComponent:
      SearchButtonValueNumberCountRange as SearchOperatorButtonValue<OperatorNumberRangeValue>,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value?.max) && Number.isFinite(value?.min) && fieldPath
        ? `count(${fieldPath}) > ${toJSON(value?.min)} && count(${fieldPath}) < ${toJSON(
            value?.max,
          )}`
        : '',
    initialValue: null,
    inputComponent: SearchFilterNumberRangeInput as SearchOperatorInput<OperatorNumberRangeValue>,
    label: 'quantity is between',
    type: 'arrayCountRange',
  }),
  arrayListIncludes: defineSearchOperator({
    buttonLabel: 'includes',
    buttonValueComponent: SearchButtonValueString as SearchOperatorButtonValue<string | number>,
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${toJSON(value)} in ${fieldPath}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringListInput as SearchOperatorInput<string | number>,
    label: 'includes',
    type: 'arrayListIncludes',
  }),
  arrayListNotIncludes: defineSearchOperator({
    buttonLabel: 'does not include',
    buttonValueComponent: SearchButtonValueString as SearchOperatorButtonValue<string | number>,
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `!(${toJSON(value)} in ${fieldPath})` : null,
    initialValue: null,
    inputComponent: SearchFilterStringListInput as SearchOperatorInput<string | number>,
    label: 'does not include',
    type: 'arrayListNotIncludes',
  }),
  arrayReferenceIncludes: defineSearchOperator({
    buttonLabel: 'includes',
    buttonValueComponent: SearchButtonValueReference as SearchOperatorButtonValue<ReferenceValue>,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${toJSON(value._ref)} in ${fieldPath}[]._ref` : null,
    initialValue: null,
    inputComponent: SearchFilterReferenceInput as SearchOperatorInput<ReferenceValue>,
    label: 'includes',
    type: 'arrayReferenceIncludes',
  }),
  arrayReferenceNotIncludes: defineSearchOperator({
    buttonLabel: 'does not include',
    buttonValueComponent: SearchButtonValueReference as SearchOperatorButtonValue<ReferenceValue>,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `!(${toJSON(value._ref)} in ${fieldPath}[]._ref)` : null,
    initialValue: null,
    inputComponent: SearchFilterReferenceInput as SearchOperatorInput<ReferenceValue>,
    label: 'does not include',
    type: 'arrayReferenceNotIncludes',
  }),
}
