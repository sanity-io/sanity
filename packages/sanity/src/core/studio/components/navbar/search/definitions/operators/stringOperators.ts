import {SearchButtonValueString} from '../../components/filters/common/ButtonValue'
import {SearchFilterStringInput} from '../../components/filters/filter/inputs/string/String'
import {SearchFilterStringListInput} from '../../components/filters/filter/inputs/string/StringList'
import {defineSearchOperator, SearchOperatorButtonValue, SearchOperatorInput} from './operatorTypes'
import {toJSON} from './operatorUtils'

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `yarn etl` fails with 'Unable to follow symbol' errors
export const stringOperators = {
  stringEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueString as SearchOperatorButtonValue<string | number>,
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    label: 'is',
    type: 'stringEqual',
  }),
  stringListEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueString as SearchOperatorButtonValue<string | number>,
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringListInput as SearchOperatorInput<string | number>,
    label: 'is',
    type: 'stringListEqual',
  }),
  stringListNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: SearchButtonValueString as SearchOperatorButtonValue<string | number>,
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringListInput as SearchOperatorInput<string | number>,
    label: 'is not',
    type: 'stringListNotEqual',
  }),
  stringMatches: defineSearchOperator({
    buttonLabel: 'contains',
    buttonValueComponent: SearchButtonValueString as SearchOperatorButtonValue<string | number>,
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath} match ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    label: 'contains',
    type: 'stringMatches',
  }),
  stringNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: SearchButtonValueString as SearchOperatorButtonValue<string | number>,
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    label: 'is not',
    type: 'stringNotEqual',
  }),
  stringNotMatches: defineSearchOperator({
    buttonLabel: 'does not contain',
    buttonValueComponent: SearchButtonValueString as SearchOperatorButtonValue<string | number>,
    groqFilter: ({fieldPath, value}) =>
      value && fieldPath ? `!(${fieldPath} match ${toJSON(value)})` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput as SearchOperatorInput<string | number>,
    label: 'does not contain',
    type: 'stringNotMatches',
  }),
}
