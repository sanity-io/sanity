import {FieldInputBoolean} from '../../components/filters/filter/inputTypes/Boolean'
import {toJSON} from './operatorUtils'
import {defineSearchOperator, SearchOperatorParams} from './operatorTypes'

export const booleanOperators = {
  booleanEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValue: (value) => (value ? 'True' : 'False'),
    fn: ({fieldPath, value}: SearchOperatorParams<boolean>) =>
      value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: true,
    inputComponent: FieldInputBoolean,
    label: 'is',
    type: 'booleanEqual',
  }),
}
