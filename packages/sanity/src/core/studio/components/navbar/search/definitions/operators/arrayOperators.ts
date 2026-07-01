import {type ReferenceValue} from '@sanity/types'
import {type ComponentType, lazy} from 'react'

import {GteIcon} from '../../components/filters/icons/GteIcon'
import {GtIcon} from '../../components/filters/icons/GtIcon'
import {LteIcon} from '../../components/filters/icons/LteIcon'
import {LtIcon} from '../../components/filters/icons/LtIcon'
import {type OperatorNumberRangeValue} from './common'
import {
  defineSearchOperator,
  type SearchOperatorButtonValue,
  type SearchOperatorInput,
} from './operatorTypes'
import {toJSON} from './operatorUtils'

// Operator definitions are evaluated pre-auth via prepareConfig; lazy-load filter input
// components to keep them out of the eager bundle.
const SearchButtonValueReference = lazy(() =>
  import('../../components/filters/common/ButtonValue').then((m) => ({
    default: m.SearchButtonValueReference,
  })),
) as ComponentType<any>
const SearchFilterNumberInput = lazy(() =>
  import('../../components/filters/filter/inputs/number/Number').then((m) => ({
    default: m.SearchFilterNumberInput,
  })),
) as ComponentType<any>
const SearchFilterNumberRangeInput = lazy(() =>
  import('../../components/filters/filter/inputs/number/NumberRange').then((m) => ({
    default: m.SearchFilterNumberRangeInput,
  })),
) as ComponentType<any>
const SearchFilterReferenceInput = lazy(() =>
  import('../../components/filters/filter/inputs/reference/Reference').then((m) => ({
    default: m.SearchFilterReferenceInput,
  })),
) as ComponentType<any>
const SearchFilterStringListInput = lazy(() =>
  import('../../components/filters/filter/inputs/string/StringList').then((m) => ({
    default: m.SearchFilterStringListInput,
  })),
) as ComponentType<any>

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `npm run etl` fails with 'Unable to follow symbol' errors
export const arrayOperators = {
  arrayCountEqual: defineSearchOperator({
    nameKey: 'search.operator.array-count-equal.name',
    descriptionKey: 'search.operator.array-count-equal.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    type: 'arrayCountEqual',
  }),
  arrayCountGt: defineSearchOperator({
    nameKey: 'search.operator.array-count-gt.name',
    descriptionKey: 'search.operator.array-count-gt.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) > ${toJSON(value)}` : null,
    icon: GtIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    type: 'arrayCountGt',
  }),
  arrayCountGte: defineSearchOperator({
    nameKey: 'search.operator.array-count-gte.name',
    descriptionKey: 'search.operator.array-count-gte.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) >= ${toJSON(value)}` : null,
    icon: GteIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    type: 'arrayCountGte',
  }),
  arrayCountLt: defineSearchOperator({
    nameKey: 'search.operator.array-count-lt.name',
    descriptionKey: 'search.operator.array-count-lt.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) < ${toJSON(value)}` : null,
    icon: LtIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    type: 'arrayCountLt',
  }),
  arrayCountLte: defineSearchOperator({
    nameKey: 'search.operator.array-count-lte.name',
    descriptionKey: 'search.operator.array-count-lte.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) <= ${toJSON(value)}` : null,
    icon: LteIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    type: 'arrayCountLte',
  }),
  arrayCountNotEqual: defineSearchOperator({
    nameKey: 'search.operator.array-count-not-equal.name',
    descriptionKey: 'search.operator.array-count-not-equal.description',
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
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
