import {type ComponentType, lazy} from 'react'

import {defineSearchOperator} from './operatorTypes'
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

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `npm run etl` fails with 'Unable to follow symbol' errors
export const assetOperators = {
  assetFileEqual: defineSearchOperator({
    nameKey: 'search.operator.asset-file-equal.name',
    descriptionKey: 'search.operator.asset-file-equal.description',
    buttonValueComponent: SearchButtonValueReference,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}.asset._ref == ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: SearchFilterAssetFileInput,
    type: 'assetFileEqual',
  }),
  assetFileNotEqual: defineSearchOperator({
    nameKey: 'search.operator.asset-file-not-equal.name',
    descriptionKey: 'search.operator.asset-file-not-equal.description',
    buttonValueComponent: SearchButtonValueReference,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}.asset._ref != ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: SearchFilterAssetFileInput,
    type: 'assetFileNotEqual',
  }),
  assetImageEqual: defineSearchOperator({
    nameKey: 'search.operator.asset-image-equal.name',
    descriptionKey: 'search.operator.asset-image-equal.description',
    buttonValueComponent: SearchButtonValueReference,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}.asset._ref == ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: SearchFilterAssetImageInput,
    type: 'assetImageEqual',
  }),
  assetImageNotEqual: defineSearchOperator({
    nameKey: 'search.operator.asset-image-not-equal.name',
    descriptionKey: 'search.operator.asset-image-not-equal.description',
    buttonValueComponent: SearchButtonValueReference,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}.asset._ref != ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: SearchFilterAssetImageInput,
    type: 'assetImageNotEqual',
  }),
}
