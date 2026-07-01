import {type ComponentType, lazy} from 'react'

import {
  defineSearchOperator,
  type SearchOperatorInput,
  type SearchOperatorParams,
} from './operatorTypes'
import {toJSON} from './operatorUtils'

// Operator definitions are evaluated pre-auth via prepareConfig; lazy-load filter input
// components to keep them out of the eager bundle.
const SearchFilterBooleanInput = lazy(() =>
  import('../../components/filters/filter/inputs/boolean/Boolean').then((m) => ({
    default: m.SearchFilterBooleanInput,
  })),
) as ComponentType<any>

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `npm run etl` fails with 'Unable to follow symbol' errors
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
