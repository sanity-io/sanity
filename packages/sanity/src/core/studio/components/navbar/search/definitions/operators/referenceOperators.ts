import {ButtonValueAsset, ButtonValueReference} from '../../components/filters/common/ButtonValue'
import {FieldInputAsset} from '../../components/filters/filter/inputTypes/Asset'
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
  referencesAssetFile: defineSearchOperator({
    buttonLabel: '→',
    buttonValueComponent: ButtonValueAsset,
    fn: ({value}) => (value?._id ? `references(${toJSON(value._id)})` : null),
    initialValue: null,
    inputComponent: FieldInputAsset('file'),
    label: 'file',
    type: 'referencesAssetFile',
  }),
  referencesAssetImage: defineSearchOperator({
    buttonLabel: '→',
    buttonValueComponent: ButtonValueAsset,
    fn: ({value}) => (value?._id ? `references(${toJSON(value._id)})` : null),
    initialValue: null,
    inputComponent: FieldInputAsset('image'),
    label: 'image',
    type: 'referencesAssetImage',
  }),
  referencesDocument: defineSearchOperator({
    buttonLabel: '→',
    buttonValueComponent: ButtonValueReference,
    fn: ({value}) => (value?._ref ? `references(${toJSON(value._ref)})` : null),
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'document',
    type: 'referencesDocument',
  }),
}
