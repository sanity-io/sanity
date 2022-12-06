import {SearchButtonValueBoolean} from '../../components/filters/common/ButtonValue'
import {SearchFilterBooleanInput} from '../../components/filters/filter/inputs/boolean/Boolean'
import {
  defineSearchOperator,
  SearchOperatorButtonValue,
  SearchOperatorInput,
  SearchOperatorParams,
} from './operatorTypes'
import {toJSON} from './operatorUtils'

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `yarn etl` fails with 'Unable to follow symbol' errors
export const booleanOperators = {
  booleanEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueBoolean as SearchOperatorButtonValue<boolean>,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<boolean>) =>
      typeof value !== 'undefined' && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: true,
    inputComponent: SearchFilterBooleanInput as SearchOperatorInput<boolean>,
    label: 'is',
    type: 'booleanEqual',
  }),
}
