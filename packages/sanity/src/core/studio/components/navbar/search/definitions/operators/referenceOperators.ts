import {ReferenceValue} from '@sanity/types'
import {SearchButtonValueReference} from '../../components/filters/common/ButtonValue'
import {SearchFilterAssetInput} from '../../components/filters/filter/inputs/asset/Asset'
import {SearchFilterReferenceInput} from '../../components/filters/filter/inputs/reference/Reference'
import {defineSearchOperator, SearchOperatorButtonValue, SearchOperatorInput} from './operatorTypes'
import {toJSON} from './operatorUtils'

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `yarn etl` fails with 'Unable to follow symbol' errors
export const referenceOperators = {
  referenceEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueReference as SearchOperatorButtonValue<ReferenceValue>,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}._ref == ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: SearchFilterReferenceInput as SearchOperatorInput<ReferenceValue>,
    label: 'is',
    type: 'referenceEqual',
  }),
  referenceNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: SearchButtonValueReference as SearchOperatorButtonValue<ReferenceValue>,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}._ref != ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: SearchFilterReferenceInput as SearchOperatorInput<ReferenceValue>,
    label: 'is not',
    type: 'referenceNotEqual',
  }),
  referencesAssetFile: defineSearchOperator({
    buttonLabel: '→',
    buttonValueComponent: SearchButtonValueReference as SearchOperatorButtonValue<ReferenceValue>,
    groqFilter: ({value}) => (value?._ref ? `references(${toJSON(value._ref)})` : null),
    initialValue: null,
    inputComponent: SearchFilterAssetInput('file'),
    label: 'file',
    type: 'referencesAssetFile',
  }),
  referencesAssetImage: defineSearchOperator({
    buttonLabel: '→',
    buttonValueComponent: SearchButtonValueReference as SearchOperatorButtonValue<ReferenceValue>,
    groqFilter: ({value}) => (value?._ref ? `references(${toJSON(value._ref)})` : null),
    initialValue: null,
    inputComponent: SearchFilterAssetInput('image'),
    label: 'image',
    type: 'referencesAssetImage',
  }),
  referencesDocument: defineSearchOperator({
    buttonLabel: '→',
    buttonValueComponent: SearchButtonValueReference as SearchOperatorButtonValue<ReferenceValue>,
    groqFilter: ({value}) => (value?._ref ? `references(${toJSON(value._ref)})` : null),
    initialValue: null,
    inputComponent: SearchFilterReferenceInput as SearchOperatorInput<ReferenceValue>,
    label: 'document',
    type: 'referencesDocument',
  }),
}
