import {ButtonValueBoolean} from '../../components/filters/common/ButtonValue'
import {FieldInputBoolean} from '../../components/filters/filter/inputTypes/Boolean'
import {defineSearchOperator, SearchOperatorParams} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const booleanOperators = {
  booleanEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: ButtonValueBoolean,
    fn: ({fieldPath, value}: SearchOperatorParams<boolean>) =>
      value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: true,
    inputComponent: FieldInputBoolean,
    label: 'is',
    type: 'booleanEqual',
  }),
}
