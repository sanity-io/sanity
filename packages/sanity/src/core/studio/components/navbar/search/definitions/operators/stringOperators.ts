import {SearchButtonValueString} from '../../components/filters/common/ButtonValue'
import {SearchFilterStringInput} from '../../components/filters/filter/inputs/String'
import {SearchFilterStringListInput} from '../../components/filters/filter/inputs/StringList'
import {defineSearchOperator} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const stringOperators = {
  stringEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueString,
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: SearchFilterStringInput,
    label: 'is',
    type: 'stringEqual',
  }),
  stringListEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueString,
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: SearchFilterStringListInput,
    label: 'is',
    type: 'stringListEqual',
  }),
  stringListNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: SearchButtonValueString,
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: SearchFilterStringListInput,
    label: 'is not',
    type: 'stringListNotEqual',
  }),
  stringMatches: defineSearchOperator({
    buttonLabel: 'contains',
    buttonValueComponent: SearchButtonValueString,
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} match ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: SearchFilterStringInput,
    label: 'contains',
    type: 'stringMatches',
  }),
  stringNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: SearchButtonValueString,
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: SearchFilterStringInput,
    label: 'is not',
    type: 'stringNotEqual',
  }),
  stringNotMatches: defineSearchOperator({
    buttonLabel: 'does not contain',
    buttonValueComponent: SearchButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `!(${fieldPath} match ${toJSON(value)})` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput,
    label: 'does not contain',
    type: 'stringNotMatches',
  }),
}
