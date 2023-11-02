import {SearchFilterStringInput} from '../../components/filters/filter/inputs/string/String'
import {SearchFilterStringListInput} from '../../components/filters/filter/inputs/string/StringList'
import {defineSearchOperator, SearchOperatorInput} from './operatorTypes'
import {toJSON} from './operatorUtils'

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `yarn etl` fails with 'Unable to follow symbol' errors
export const stringOperators = {
  stringEqual: defineSearchOperator({
    nameKey: 'search.operator.string-equal.name',
    descriptionKey: 'search.operator.string-equal.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    type: 'stringEqual',
  }),
  stringListEqual: defineSearchOperator({
    nameKey: 'search.operator.string-list-equal.name',
    descriptionKey: 'search.operator.string-list-equal.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringListInput as SearchOperatorInput<string | number>,
    type: 'stringListEqual',
  }),
  stringListNotEqual: defineSearchOperator({
    nameKey: 'search.operator.string-list-not-equal.name',
    descriptionKey: 'search.operator.string-list-not-equal.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringListInput as SearchOperatorInput<string | number>,
    type: 'stringListNotEqual',
  }),
  stringMatches: defineSearchOperator({
    nameKey: 'search.operator.string-contains.name',
    descriptionKey: 'search.operator.string-contains.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath} match ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    type: 'stringMatches',
  }),
  stringNotEqual: defineSearchOperator({
    nameKey: 'search.operator.string-not-equal.name',
    descriptionKey: 'search.operator.string-not-equal.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    type: 'stringNotEqual',
  }),
  stringNotMatches: defineSearchOperator({
    nameKey: 'search.operator.string-not-contains.name',
    descriptionKey: 'search.operator.string-not-contains.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `!(${fieldPath} match ${toJSON(value)})` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    type: 'stringNotMatches',
  }),
}
