import {ButtonValueReference} from '../../components/filters/common/ButtonValue'
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
  references: defineSearchOperator({
    buttonLabel: 'to',
    buttonValueComponent: ButtonValueReference,
    fn: ({value}) => (value?._ref ? `references(${toJSON(value._ref)})` : null),
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'contains reference',
    type: 'references',
  }),
}
