import {SearchButtonValueReference} from '../../components/filters/common/ButtonValue'
import {SearchFilterAssetInput} from '../../components/filters/filter/inputs/asset/Asset'
import {defineSearchOperator} from './operatorTypes'
import {toJSON} from './operatorUtils'

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
    inputComponent: SearchFilterAssetInput('file'),
    type: 'assetFileEqual',
  }),
  assetFileNotEqual: defineSearchOperator({
    nameKey: 'search.operator.asset-file-not-equal.name',
    descriptionKey: 'search.operator.asset-file-not-equal.description',
    buttonValueComponent: SearchButtonValueReference,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}.asset._ref != ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: SearchFilterAssetInput('file'),
    type: 'assetFileNotEqual',
  }),
  assetImageEqual: defineSearchOperator({
    nameKey: 'search.operator.asset-image-equal.name',
    descriptionKey: 'search.operator.asset-image-equal.description',
    buttonValueComponent: SearchButtonValueReference,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}.asset._ref == ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: SearchFilterAssetInput('image'),
    type: 'assetImageEqual',
  }),
  assetImageNotEqual: defineSearchOperator({
    nameKey: 'search.operator.asset-image-not-equal.name',
    descriptionKey: 'search.operator.asset-image-not-equal.description',
    buttonValueComponent: SearchButtonValueReference,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}.asset._ref != ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: SearchFilterAssetInput('image'),
    type: 'assetImageNotEqual',
  }),
}
