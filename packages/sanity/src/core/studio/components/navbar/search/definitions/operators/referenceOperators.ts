import {type ReferenceValue} from '@sanity/types'
import {type ComponentType, lazy} from 'react'

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
// SearchFilterAssetInput is a factory; create one lazy component per variant.
const SearchFilterAssetFileInput = lazy(() =>
  import('../../components/filters/filter/inputs/asset/Asset').then((m) => ({
    default: m.SearchFilterAssetInput('file'),
  })),
) as ComponentType<any>
const SearchFilterAssetImageInput = lazy(() =>
  import('../../components/filters/filter/inputs/asset/Asset').then((m) => ({
    default: m.SearchFilterAssetInput('image'),
  })),
) as ComponentType<any>
const SearchFilterReferenceInput = lazy(() =>
  import('../../components/filters/filter/inputs/reference/Reference').then((m) => ({
    default: m.SearchFilterReferenceInput,
  })),
) as ComponentType<any>

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `npm etl` fails with 'Unable to follow symbol' errors
export const referenceOperators = {
  referenceEqual: defineSearchOperator({
    nameKey: 'search.operator.reference-equal.name',
    descriptionKey: 'search.operator.reference-equal.description',
    buttonValueComponent: SearchButtonValueReference as SearchOperatorButtonValue<ReferenceValue>,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}._ref == ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: SearchFilterReferenceInput as SearchOperatorInput<ReferenceValue>,
    type: 'referenceEqual',
  }),
  referenceNotEqual: defineSearchOperator({
    nameKey: 'search.operator.reference-not-equal.name',
    descriptionKey: 'search.operator.reference-not-equal.description',
    buttonValueComponent: SearchButtonValueReference as SearchOperatorButtonValue<ReferenceValue>,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}._ref != ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: SearchFilterReferenceInput as SearchOperatorInput<ReferenceValue>,
    type: 'referenceNotEqual',
  }),
  referencesAssetFile: defineSearchOperator({
    nameKey: 'search.operator.reference-asset-file.name',
    descriptionKey: 'search.operator.reference-asset-file.description',
    buttonValueComponent: SearchButtonValueReference as SearchOperatorButtonValue<ReferenceValue>,
    groqFilter: ({value}) => (value?._ref ? `references(${toJSON(value._ref)})` : null),
    initialValue: null,
    inputComponent: SearchFilterAssetFileInput,
    type: 'referencesAssetFile',
  }),
  referencesAssetImage: defineSearchOperator({
    nameKey: 'search.operator.reference-asset-image.name',
    descriptionKey: 'search.operator.reference-asset-image.description',
    buttonValueComponent: SearchButtonValueReference as SearchOperatorButtonValue<ReferenceValue>,
    groqFilter: ({value}) => (value?._ref ? `references(${toJSON(value._ref)})` : null),
    initialValue: null,
    inputComponent: SearchFilterAssetImageInput,
    type: 'referencesAssetImage',
  }),
  referencesDocument: defineSearchOperator({
    nameKey: 'search.operator.reference-document.name',
    descriptionKey: 'search.operator.reference-document.description',
    buttonValueComponent: SearchButtonValueReference as SearchOperatorButtonValue<ReferenceValue>,
    groqFilter: ({value}) => (value?._ref ? `references(${toJSON(value._ref)})` : null),
    initialValue: null,
    inputComponent: SearchFilterReferenceInput as SearchOperatorInput<ReferenceValue>,
    type: 'referencesDocument',
  }),
}
