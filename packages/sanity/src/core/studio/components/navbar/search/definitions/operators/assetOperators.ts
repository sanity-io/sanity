import {ButtonValueAsset} from '../../components/filters/common/ButtonValue'
import {FieldInputAssetImage} from '../../components/filters/filter/inputTypes/AssetImage'
import {defineSearchOperator} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const assetOperators = {
  assetImageEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: ButtonValueAsset,
    fn: ({fieldPath, value}) =>
      value?._id && fieldPath ? `${fieldPath}.asset._ref == ${toJSON(value._id)}` : null,
    initialValue: null,
    inputComponent: FieldInputAssetImage,
    label: 'is',
    type: 'assetImageEqual',
  }),
  assetImageNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: ButtonValueAsset,
    fn: ({fieldPath, value}) =>
      value?._id && fieldPath ? `${fieldPath}.asset._ref != ${toJSON(value._id)}` : null,
    initialValue: null,
    inputComponent: FieldInputAssetImage,
    label: 'is not',
    type: 'assetImageNotEqual',
  }),
}
