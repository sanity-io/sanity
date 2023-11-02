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
    inputComponent: SearchFilterAssetInput('file'),
    type: 'referencesAssetFile',
  }),
  referencesAssetImage: defineSearchOperator({
    nameKey: 'search.operator.reference-asset-image.name',
    descriptionKey: 'search.operator.reference-asset-image.description',
    buttonValueComponent: SearchButtonValueReference as SearchOperatorButtonValue<ReferenceValue>,
    groqFilter: ({value}) => (value?._ref ? `references(${toJSON(value._ref)})` : null),
    initialValue: null,
    inputComponent: SearchFilterAssetInput('image'),
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
