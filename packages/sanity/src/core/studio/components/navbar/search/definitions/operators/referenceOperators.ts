import {FieldInputReference} from '../../components/filters/filter/inputTypes/Reference'
import {toJSON} from './operatorUtils'
import {defineSearchOperator} from './operatorTypes'

export const referenceOperators = {
  referenceEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValue: (value) => (value?._ref ? value._ref.slice(0, 8) : null),
    fn: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}._ref == ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'is',
    type: 'referenceEqual',
  }),
  referenceNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValue: (value) => (value?._ref ? value._ref.slice(0, 8) : null),
    fn: ({fieldPath, value}) =>
      value?._ref && fieldPath ? `${fieldPath}._ref != ${toJSON(value._ref)}` : null,
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'is not',
    type: 'referenceNotEqual',
  }),
  references: defineSearchOperator({
    buttonLabel: 'to',
    buttonValue: (value) => (value?._ref ? value._ref.slice(0, 8) : null),
    fn: ({value}) => (value?._ref ? `references(${toJSON(value._ref)})` : null),
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'contains reference',
    type: 'references',
  }),
}
