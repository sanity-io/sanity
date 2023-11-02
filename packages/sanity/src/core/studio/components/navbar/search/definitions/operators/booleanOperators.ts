import {SearchFilterBooleanInput} from '../../components/filters/filter/inputs/boolean/Boolean'
import {defineSearchOperator, SearchOperatorInput, SearchOperatorParams} from './operatorTypes'
import {toJSON} from './operatorUtils'

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `yarn etl` fails with 'Unable to follow symbol' errors
export const booleanOperators = {
  booleanEqual: defineSearchOperator({
    nameKey: 'search.operator.boolean-equal.name',
    descriptionKey: 'search.operator.boolean-equal.description',
    groqFilter: ({fieldPath, value}: SearchOperatorParams<boolean>) =>
      typeof value !== 'undefined' && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: true,
    inputComponent: SearchFilterBooleanInput as SearchOperatorInput<boolean>,
    type: 'booleanEqual',
  }),
}
