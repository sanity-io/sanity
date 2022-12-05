import {SearchButtonValueString} from '../../components/filters/common/ButtonValue'
import {SearchFilterStringInput} from '../../components/filters/filter/inputs/string/String'
import {defineSearchOperator, SearchOperatorButtonValue, SearchOperatorInput} from './operatorTypes'
import {toJSON} from './operatorUtils'

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `yarn etl` fails with 'Unable to follow symbol' errors
export const portableTextOperators = {
  portableTextEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueString as SearchOperatorButtonValue<string | number>,
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `pt::text(${fieldPath}) == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    label: 'is',
    type: 'portableTextEqual',
  }),
  portableTextMatches: defineSearchOperator({
    buttonLabel: 'contains',
    buttonValueComponent: SearchButtonValueString as SearchOperatorButtonValue<string | number>,
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `pt::text(${fieldPath}) match ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    label: 'contains',
    type: 'portableTextMatches',
  }),
  portableTextNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: SearchButtonValueString as SearchOperatorButtonValue<string | number>,
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `pt::text(${fieldPath}) != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    label: 'is not',
    type: 'portableTextNotEqual',
  }),
  portableTextNotMatches: defineSearchOperator({
    buttonLabel: 'does not contain',
    buttonValueComponent: SearchButtonValueString as SearchOperatorButtonValue<string | number>,
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `!(pt::text(${fieldPath}) match ${toJSON(value)})` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    label: 'does not contain',
    type: 'portableTextNotMatches',
  }),
}
