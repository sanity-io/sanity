import {SearchFilterStringInput} from '../../components/filters/filter/inputs/string/String'
import {defineSearchOperator, type SearchOperatorInput} from './operatorTypes'
import {toJSON} from './operatorUtils'

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `yarn etl` fails with 'Unable to follow symbol' errors
export const portableTextOperators = {
  portableTextEqual: defineSearchOperator({
    nameKey: 'search.operator.portable-text-equal.name',
    descriptionKey: 'search.operator.portable-text-equal.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `pt::text(${fieldPath}) == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    type: 'portableTextEqual',
  }),
  portableTextMatches: defineSearchOperator({
    nameKey: 'search.operator.portable-text-contains.name',
    descriptionKey: 'search.operator.portable-text-contains.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `pt::text(${fieldPath}) match ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    type: 'portableTextMatches',
  }),
  portableTextNotEqual: defineSearchOperator({
    nameKey: 'search.operator.portable-text-not-equal.name',
    descriptionKey: 'search.operator.portable-text-not-equal.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `pt::text(${fieldPath}) != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    type: 'portableTextNotEqual',
  }),
  portableTextNotMatches: defineSearchOperator({
    nameKey: 'search.operator.portable-text-not-contains.name',
    descriptionKey: 'search.operator.portable-text-not-contains.description',
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `!(pt::text(${fieldPath}) match ${toJSON(value)})` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    type: 'portableTextNotMatches',
  }),
}
