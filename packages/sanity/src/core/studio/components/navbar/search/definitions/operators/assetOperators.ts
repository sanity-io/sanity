import {SearchButtonValueAsset} from '../../components/filters/common/ButtonValue'
import {SearchFilterAssetInput} from '../../components/filters/filter/inputs/asset/Asset'
import {defineSearchOperator} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const assetOperators = {
  assetFileEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueAsset,
    fn: ({fieldPath, value}) =>
      value?._id && fieldPath ? `${fieldPath}.asset._ref == ${toJSON(value._id)}` : null,
    initialValue: null,
    inputComponent: SearchFilterAssetInput('file'),
    label: 'is',
    type: 'assetFileEqual',
  }),
  assetFileNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: SearchButtonValueAsset,
    fn: ({fieldPath, value}) =>
      value?._id && fieldPath ? `${fieldPath}.asset._ref != ${toJSON(value._id)}` : null,
    initialValue: null,
    inputComponent: SearchFilterAssetInput('file'),
    label: 'is not',
    type: 'assetFileNotEqual',
  }),
  assetImageEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueAsset,
    fn: ({fieldPath, value}) =>
      value?._id && fieldPath ? `${fieldPath}.asset._ref == ${toJSON(value._id)}` : null,
    initialValue: null,
    inputComponent: SearchFilterAssetInput('image'),
    label: 'is',
    type: 'assetImageEqual',
  }),
  assetImageNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: SearchButtonValueAsset,
    fn: ({fieldPath, value}) =>
      value?._id && fieldPath ? `${fieldPath}.asset._ref != ${toJSON(value._id)}` : null,
    initialValue: null,
    inputComponent: SearchFilterAssetInput('image'),
    label: 'is not',
    type: 'assetImageNotEqual',
  }),
}
