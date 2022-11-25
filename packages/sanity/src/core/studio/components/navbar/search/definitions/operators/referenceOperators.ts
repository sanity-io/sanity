import {ButtonValueAsset, ButtonValueReference} from '../../components/filters/common/ButtonValue'
import {FieldInputAssetImage} from '../../components/filters/filter/inputTypes/AssetImage'
import {FieldInputReference} from '../../components/filters/filter/inputTypes/Reference'
import {defineSearchOperator} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const referenceOperators = {
  referenceEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: ButtonValueReference,
    fn: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}._ref == ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'is',
    type: 'referenceEqual',
  }),
  referenceNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: ButtonValueReference,
    fn: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}._ref != ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'is not',
    type: 'referenceNotEqual',
  }),
  referencesAssetImage: defineSearchOperator({
    buttonLabel: 'to',
    buttonValueComponent: ButtonValueAsset,
    fn: ({value}) => (value?._id ? `references(${toJSON(value._id)})` : null),
    initialValue: null,
    inputComponent: FieldInputAssetImage,
    label: 'contains image',
    type: 'referencesAssetImage',
  }),
  referencesDocument: defineSearchOperator({
    buttonLabel: 'to',
    buttonValueComponent: ButtonValueReference,
    fn: ({value}) => (value?._ref ? `references(${toJSON(value._ref)})` : null),
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'contains reference',
    type: 'referencesDocument',
  }),
}
