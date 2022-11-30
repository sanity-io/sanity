import {SearchButtonValueBoolean} from '../../components/filters/common/ButtonValue'
import {SearchFilterBooleanInput} from '../../components/filters/filter/inputs/boolean/Boolean'
import {defineSearchOperator, SearchOperatorParams} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const booleanOperators = {
  booleanEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueBoolean,
    fn: ({fieldPath, value}: SearchOperatorParams<boolean>) =>
      typeof value !== 'undefined' && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: true,
    inputComponent: SearchFilterBooleanInput,
    label: 'is',
    type: 'booleanEqual',
  }),
}
