import {SearchFilterStringInput} from '../../components/filters/filter/inputs/string/String'
import {defineSearchOperator, type SearchOperatorInput} from './operatorTypes'
import {toJSON} from './operatorUtils'

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `yarn etl` fails with 'Unable to follow symbol' errors
export const slugOperators = {
  slugEqual: defineSearchOperator({
    nameKey: 'search.operator.slug-equal.name',
    descriptionKey: 'search.operator.slug-equal.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath}.current == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    type: 'slugEqual',
  }),
  slugMatches: defineSearchOperator({
    nameKey: 'search.operator.slug-contains.name',
    descriptionKey: 'search.operator.slug-contains.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath}.current match ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    label: 'contains',
    type: 'slugMatches',
  }),
  slugNotEqual: defineSearchOperator({
    nameKey: 'search.operator.slug-not-equal.name',
    descriptionKey: 'search.operator.slug-not-equal.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath}.current != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    type: 'slugNotEqual',
  }),
  slugNotMatches: defineSearchOperator({
    nameKey: 'search.operator.slug-not-contains.name',
    descriptionKey: 'search.operator.slug-not-contains.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `!(${fieldPath}.current match ${toJSON(value)})` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    type: 'slugNotMatches',
  }),
}
