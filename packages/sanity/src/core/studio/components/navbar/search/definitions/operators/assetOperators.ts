import {ButtonValueAsset} from '../../components/filters/common/ButtonValue'
import {FieldInputAsset} from '../../components/filters/filter/inputTypes/Asset'
import {defineSearchOperator} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const assetOperators = {
  assetFileEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: ButtonValueAsset,
    fn: ({fieldPath, value}) =>
      value?._id && fieldPath ? `${fieldPath}.asset._ref == ${toJSON(value._id)}` : null,
    initialValue: null,
    inputComponent: FieldInputAsset('file'),
    label: 'is',
    type: 'assetFileEqual',
  }),
  assetFileNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: ButtonValueAsset,
    fn: ({fieldPath, value}) =>
      value?._id && fieldPath ? `${fieldPath}.asset._ref != ${toJSON(value._id)}` : null,
    initialValue: null,
    inputComponent: FieldInputAsset('file'),
    label: 'is not',
    type: 'assetFileNotEqual',
  }),
  assetImageEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: ButtonValueAsset,
    fn: ({fieldPath, value}) =>
      value?._id && fieldPath ? `${fieldPath}.asset._ref == ${toJSON(value._id)}` : null,
    initialValue: null,
    inputComponent: FieldInputAsset('image'),
    label: 'is',
    type: 'assetImageEqual',
  }),
  assetImageNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: ButtonValueAsset,
    fn: ({fieldPath, value}) =>
      value?._id && fieldPath ? `${fieldPath}.asset._ref != ${toJSON(value._id)}` : null,
    initialValue: null,
    inputComponent: FieldInputAsset('image'),
    label: 'is not',
    type: 'assetImageNotEqual',
  }),
}
