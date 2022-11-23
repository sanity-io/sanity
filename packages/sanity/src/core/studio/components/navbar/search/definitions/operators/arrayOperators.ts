import {typed} from '@sanity/types'
import {
  ButtonValueNumberCount,
  ButtonValueNumberCountRange,
  ButtonValueString,
} from '../../components/filters/common/ButtonValue'
import {FieldInputNumber} from '../../components/filters/filter/inputTypes/Number'
import {FieldInputNumberRange} from '../../components/filters/filter/inputTypes/NumberRange'
import {FieldInputStringList} from '../../components/filters/filter/inputTypes/StringList'
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
    buttonValueComponent: ButtonValueNumberCount,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity is',
    type: 'arrayCountEqual',
  }),
  arrayCountGt: defineSearchOperator({
    buttonLabel: 'has >',
    buttonValueComponent: ButtonValueNumberCount,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) > ${toJSON(value)}` : null,
    icon: GtIcon,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity greater than',
    type: 'arrayCountGt',
  }),
  arrayCountGte: defineSearchOperator({
    buttonLabel: 'has ≥',
    buttonValueComponent: ButtonValueNumberCount,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) >= ${toJSON(value)}` : null,
    icon: GteIcon,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity greater than or equal to',
    type: 'arrayCountGte',
  }),
  arrayCountLt: defineSearchOperator({
    buttonLabel: 'has <',
    buttonValueComponent: ButtonValueNumberCount,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) < ${toJSON(value)}` : null,
    icon: LtIcon,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity less than',
    type: 'arrayCountLt',
  }),
  arrayCountLte: defineSearchOperator({
    buttonLabel: 'has ≤',
    buttonValueComponent: ButtonValueNumberCount,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) <= ${toJSON(value)}` : null,
    icon: LteIcon,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity less than or equal to',
    type: 'arrayCountLte',
  }),
  arrayCountNotEqual: defineSearchOperator({
    buttonLabel: 'does not have',
    buttonValueComponent: ButtonValueNumberCount,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity is not',
    type: 'arrayCountNotEqual',
  }),
  arrayCountRange: defineSearchOperator({
    buttonLabel: 'has between',
    buttonValueComponent: ButtonValueNumberCountRange,
    inputComponent: FieldInputNumberRange,
    initialValue: typed<OperatorNumberRangeValue>({max: null, min: null}),
    fn: ({fieldPath, value}) =>
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
    buttonValueComponent: ButtonValueString,
    fn: ({fieldPath, value}) => (value && fieldPath ? `${toJSON(value)} in ${fieldPath}` : null),
    initialValue: null,
    inputComponent: FieldInputStringList,
    label: 'contains',
    type: 'arrayListContains',
  }),
  arrayListNotContains: defineSearchOperator({
    buttonLabel: 'does not contain',
    buttonValueComponent: ButtonValueString,
    fn: ({fieldPath, value}) => (value && fieldPath ? `!(${toJSON(value)} in ${fieldPath})` : null),
    initialValue: null,
    inputComponent: FieldInputStringList,
    label: 'does not contain',
    type: 'arrayListNotContains',
  }),
}
