import {SearchButtonValueReference} from '../../components/filters/common/ButtonValue'
import {SearchFilterAssetInput} from '../../components/filters/filter/inputs/asset/Asset'
import {SearchFilterReferenceInput} from '../../components/filters/filter/inputs/reference/Reference'
import {defineSearchOperator} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const referenceOperators = {
  referenceEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueReference,
    fn: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}._ref == ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: SearchFilterReferenceInput,
    label: 'is',
    type: 'referenceEqual',
  }),
  referenceNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: SearchButtonValueReference,
    fn: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}._ref != ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: SearchFilterReferenceInput,
    label: 'is not',
    type: 'referenceNotEqual',
  }),
  referencesAssetFile: defineSearchOperator({
    buttonLabel: '→',
    buttonValueComponent: SearchButtonValueReference,
    fn: ({value}) => (value?._ref ? `references(${toJSON(value._ref)})` : null),
    initialValue: null,
    inputComponent: SearchFilterAssetInput('file'),
    label: 'file',
    type: 'referencesAssetFile',
  }),
  referencesAssetImage: defineSearchOperator({
    buttonLabel: '→',
    buttonValueComponent: SearchButtonValueReference,
    fn: ({value}) => (value?._ref ? `references(${toJSON(value._ref)})` : null),
    initialValue: null,
    inputComponent: SearchFilterAssetInput('image'),
    label: 'image',
    type: 'referencesAssetImage',
  }),
  referencesDocument: defineSearchOperator({
    buttonLabel: '→',
    buttonValueComponent: SearchButtonValueReference,
    fn: ({value}) => (value?._ref ? `references(${toJSON(value._ref)})` : null),
    initialValue: null,
    inputComponent: SearchFilterReferenceInput,
    label: 'document',
    type: 'referencesDocument',
  }),
}
