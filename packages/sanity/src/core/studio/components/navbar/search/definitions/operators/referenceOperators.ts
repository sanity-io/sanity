import {FieldInputReference} from '../../components/filters/filter/inputTypes/Reference'
import {toJSON} from './operatorUtils'
import {defineSearchOperator} from './operatorTypes'

export const referenceOperators = {
  referenceEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValue: (value) => (value ? value.slice(0, 8) : null),
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath}._ref == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'is',
    type: 'referenceEqual',
  }),
  references: defineSearchOperator({
    buttonLabel: 'to',
    buttonValue: (value) => (value ? value.slice(0, 8) : null),
    fn: ({value}) => (value ? `references(${toJSON(value)})` : null),
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'contains reference',
    type: 'references',
  }),
}
