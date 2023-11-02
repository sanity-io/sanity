import {type ReferenceValue} from '@sanity/types'
import {SearchButtonValueReference} from '../../components/filters/common/ButtonValue'
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
    nameKey: 'search.operator.array-count-equal.name',
    descriptionKey: 'search.operator.array-count-equal.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    type: 'arrayCountEqual',
  }),
  arrayCountGt: defineSearchOperator({
    nameKey: 'search.operator.array-count-gt.name',
    descriptionKey: 'search.operator.array-count-gt.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) > ${toJSON(value)}` : null,
    icon: GtIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    type: 'arrayCountGt',
  }),
  arrayCountGte: defineSearchOperator({
    nameKey: 'search.operator.array-count-gte.name',
    descriptionKey: 'search.operator.array-count-gte.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) >= ${toJSON(value)}` : null,
    icon: GteIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    type: 'arrayCountGte',
  }),
  arrayCountLt: defineSearchOperator({
    nameKey: 'search.operator.array-count-lt.name',
    descriptionKey: 'search.operator.array-count-lt.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) < ${toJSON(value)}` : null,
    icon: LtIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    type: 'arrayCountLt',
  }),
  arrayCountLte: defineSearchOperator({
    nameKey: 'search.operator.array-count-lte.name',
    descriptionKey: 'search.operator.array-count-lte.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) <= ${toJSON(value)}` : null,
    icon: LteIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    type: 'arrayCountLte',
  }),
  arrayCountNotEqual: defineSearchOperator({
    nameKey: 'search.operator.array-count-not-equal.name',
    descriptionKey: 'search.operator.array-count-not-equal.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterNumberInput as SearchOperatorInput<number>,
    type: 'arrayCountNotEqual',
  }),
  arrayCountRange: defineSearchOperator({
    nameKey: 'search.operator.array-count-range.name',
    descriptionKey: 'search.operator.array-count-range.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value?.to) && Number.isFinite(value?.from) && fieldPath
        ? `count(${fieldPath}) > ${toJSON(value?.from)} && count(${fieldPath}) < ${toJSON(
            value?.to,
          )}`
        : '',
    initialValue: null,
    inputComponent: SearchFilterNumberRangeInput as SearchOperatorInput<OperatorNumberRangeValue>,
    type: 'arrayCountRange',
  }),
  arrayListIncludes: defineSearchOperator({
    nameKey: 'search.operator.array-list-includes.name',
    descriptionKey: 'search.operator.array-list-includes.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${toJSON(value)} in ${fieldPath}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringListInput as SearchOperatorInput<string | number>,
    type: 'arrayListIncludes',
  }),
  arrayListNotIncludes: defineSearchOperator({
    nameKey: 'search.operator.array-list-not-includes.name',
    descriptionKey: 'search.operator.array-list-not-includes.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `!(${toJSON(value)} in ${fieldPath})` : null,
    initialValue: null,
    inputComponent: SearchFilterStringListInput as SearchOperatorInput<string | number>,
    type: 'arrayListNotIncludes',
  }),
  arrayReferenceIncludes: defineSearchOperator({
    nameKey: 'search.operator.array-reference-includes.name',
    descriptionKey: 'search.operator.array-reference-includes.description',
    buttonValueComponent: SearchButtonValueReference as SearchOperatorButtonValue<ReferenceValue>,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${toJSON(value._ref)} in ${fieldPath}[]._ref` : null,
    initialValue: null,
    inputComponent: SearchFilterReferenceInput as SearchOperatorInput<ReferenceValue>,
    type: 'arrayReferenceIncludes',
  }),
  arrayReferenceNotIncludes: defineSearchOperator({
    nameKey: 'search.operator.array-reference-not-includes.name',
    descriptionKey: 'search.operator.array-reference-not-includes.description',
    buttonValueComponent: SearchButtonValueReference as SearchOperatorButtonValue<ReferenceValue>,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `!(${toJSON(value._ref)} in ${fieldPath}[]._ref)` : null,
    initialValue: null,
    inputComponent: SearchFilterReferenceInput as SearchOperatorInput<ReferenceValue>,
    type: 'arrayReferenceNotIncludes',
  }),
}
