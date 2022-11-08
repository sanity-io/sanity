import {FieldInputReference} from '../../components/filters/filter/inputTypes/Reference'
import {toJSON} from './operatorUtils'
import {defineSearchOperator} from './operatorTypes'

export const referenceOperators = {
  referenceEqual: defineSearchOperator({
    buttonLabel: 'is',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath}._ref == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'is',
    type: 'referenceEqual',
  }),
  references: defineSearchOperator({
    buttonLabel: 'references document',
    fn: ({value}) => (value ? `references(${toJSON(value)})` : null),
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'references document',
    type: 'references',
  }),
}
