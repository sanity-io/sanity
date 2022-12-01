import {typed} from '@sanity/types'
import {
  SearchButtonValueNumberCount,
  SearchButtonValueNumberCountRange,
  SearchButtonValueReference,
  SearchButtonValueString,
} from '../../components/filters/common/ButtonValue'
import {SearchFilterNumberInput} from '../../components/filters/filter/inputs/number/Number'
import {SearchFilterNumberRangeInput} from '../../components/filters/filter/inputs/number/NumberRange'
import {SearchFilterReferenceInput} from '../../components/filters/filter/inputs/reference/Reference'
import {SearchFilterStringListInput} from '../../components/filters/filter/inputs/string/StringList'
import {GteIcon} from '../../components/filters/icons/GteIcon'
import {GtIcon} from '../../components/filters/icons/GtIcon'
import {LteIcon} from '../../components/filters/icons/LteIcon'
import {LtIcon} from '../../components/filters/icons/LtIcon'
import {OperatorNumberRangeValue} from './common'
import {defineSearchOperator} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const arrayOperators = {
  arrayCountEqual: defineSearchOperator({
    buttonLabel: 'has',
    buttonValueComponent: SearchButtonValueNumberCount,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    label: 'quantity is',
    type: 'arrayCountEqual',
  }),
  arrayCountGt: defineSearchOperator({
    buttonLabel: 'has >',
    buttonValueComponent: SearchButtonValueNumberCount,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) > ${toJSON(value)}` : null,
    icon: GtIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    label: 'quantity greater than',
    type: 'arrayCountGt',
  }),
  arrayCountGte: defineSearchOperator({
    buttonLabel: 'has ≥',
    buttonValueComponent: SearchButtonValueNumberCount,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) >= ${toJSON(value)}` : null,
    icon: GteIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    label: 'quantity greater than or equal to',
    type: 'arrayCountGte',
  }),
  arrayCountLt: defineSearchOperator({
    buttonLabel: 'has <',
    buttonValueComponent: SearchButtonValueNumberCount,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) < ${toJSON(value)}` : null,
    icon: LtIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    label: 'quantity less than',
    type: 'arrayCountLt',
  }),
  arrayCountLte: defineSearchOperator({
    buttonLabel: 'has ≤',
    buttonValueComponent: SearchButtonValueNumberCount,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) <= ${toJSON(value)}` : null,
    icon: LteIcon,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    label: 'quantity less than or equal to',
    type: 'arrayCountLte',
  }),
  arrayCountNotEqual: defineSearchOperator({
    buttonLabel: 'does not have',
    buttonValueComponent: SearchButtonValueNumberCount,
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value) && fieldPath ? `count(${fieldPath}) != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterNumberInput,
    label: 'quantity is not',
    type: 'arrayCountNotEqual',
  }),
  arrayCountRange: defineSearchOperator({
    buttonLabel: 'has between',
    buttonValueComponent: SearchButtonValueNumberCountRange,
    inputComponent: SearchFilterNumberRangeInput,
    initialValue: typed<OperatorNumberRangeValue>({max: null, min: null}),
    groqFilter: ({fieldPath, value}) =>
      Number.isFinite(value?.max) && Number.isFinite(value?.min) && fieldPath
        ? `count(${fieldPath}) > ${toJSON(value?.min)} && count(${fieldPath}) < ${toJSON(
            value?.max
          )}`
        : '',
    label: 'quantity is between',
    type: 'arrayCountRange',
  }),
  arrayListContains: defineSearchOperator({
    buttonLabel: 'contains',
    buttonValueComponent: SearchButtonValueString,
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${toJSON(value)} in ${fieldPath}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringListInput,
    label: 'contains',
    type: 'arrayListContains',
  }),
  arrayListNotContains: defineSearchOperator({
    buttonLabel: 'does not contain',
    buttonValueComponent: SearchButtonValueString,
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `!(${toJSON(value)} in ${fieldPath})` : null,
    initialValue: null,
    inputComponent: SearchFilterStringListInput,
    label: 'does not contain',
    type: 'arrayListNotContains',
  }),
  arrayReferenceContains: defineSearchOperator({
    buttonLabel: 'contains',
    buttonValueComponent: SearchButtonValueReference,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${toJSON(value._ref)} in ${fieldPath}[]._ref` : null,
    initialValue: null,
    inputComponent: SearchFilterReferenceInput,
    label: 'contains',
    type: 'arrayReferenceContains',
  }),
  arrayReferenceNotContains: defineSearchOperator({
    buttonLabel: 'does not contain',
    buttonValueComponent: SearchButtonValueReference,
    groqFilter: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `!(${toJSON(value._ref)} in ${fieldPath}[]._ref)` : null,
    initialValue: null,
    inputComponent: SearchFilterReferenceInput,
    label: 'does not contain',
    type: 'arrayReferenceNotContains',
  }),
}
